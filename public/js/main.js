gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({
    duration: 1.2,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t))
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// ★修正: テーマ管理を一元化
function initTheme() {
    const toggleBtn = document.getElementById("theme-toggle");
    const icon = toggleBtn.querySelector("i");
    const htmlEl = document.documentElement; // <html>タグ
    const bodyEl = document.body;            // <body>タグ

    // システム設定を確認
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;

    // 適用関数
    const applyTheme = (isLight) => {
        if (isLight) {
            bodyEl.classList.add("light-mode");
            htmlEl.classList.remove("dark"); // Shoelace用
            htmlEl.classList.add("light");
            icon.setAttribute("data-lucide", "sun");
        } else {
            bodyEl.classList.remove("light-mode");
            htmlEl.classList.add("dark");    // Shoelace用
            htmlEl.classList.remove("light");
            icon.setAttribute("data-lucide", "moon");
        }
        lucide.createIcons();

        // 背景JSに通知
        window.dispatchEvent(
            new CustomEvent("theme-change", {
                detail: { isLight: isLight }
            })
        );
    };

    // 初期実行
    applyTheme(prefersLight);

    // ボタンクリック時
    toggleBtn.addEventListener("click", () => {
        const isCurrentLight = bodyEl.classList.contains("light-mode");
        applyTheme(!isCurrentLight);
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    // 1. まずテーマを確定させる
    initTheme();
    lucide.createIcons();

    try {
        // 2. 設定ファイルの読み込み
        const response = await fetch("./settings.json");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        renderContent(data);
        
        // 背景JSにも設定を渡すためのイベントを発火（念のため）
        window.dispatchEvent(new CustomEvent("settings-loaded", { detail: data }));

    } catch (error) {
        console.error("Error loading settings.json:", error);
        console.warn("★重要: ローカルサーバー(Live Server等)で実行していますか？ file:// プロトコルではJSONは読み込めません。");
        renderFallback();
    } finally {
        initIcons();
        initAnimations();

        const onFullLoad = () => {
            setTimeout(() => {
                document.body.classList.add('is-loaded');
                setTimeout(() => {
                    ScrollTrigger.refresh();
                }, 1000);
            }, 800); 
        };

        if (document.readyState === 'complete') {
            onFullLoad();
        } else {
            window.addEventListener('load', onFullLoad);
        }
    }
});

// ... (renderContent, renderFallback, initIcons, initAnimations, dockItems の処理は変更なし) ...
// ※ renderContent関数などは元のコードのまま維持してください
function renderContent(data) {
    const pName = document.getElementById("profile-name");
    const pRole = document.getElementById("profile-role");
    const pAvatar = document.getElementById("profile-avatar");

    if (pName) pName.textContent = data.profile.name;
    if (pRole) pRole.textContent = data.profile.role;
    if (pAvatar && data.profile.avatar) {
        pAvatar.src = data.profile.avatar;
    }

    const socialList = document.getElementById("social-list");
    if (socialList) {
        socialList.innerHTML = "";
        data.socials.forEach(social => {
            const a = document.createElement("a");
            a.href = social.url;
            a.className = "social-link";
            a.innerHTML = `${social.name} <i data-lucide="arrow-up-right" class="arrow-icon"></i>`;
            socialList.appendChild(a);
        });
    }

    const blogList = document.getElementById("blog-list");
    if (blogList) {
        blogList.innerHTML = "";
        const isMobile = "ontouchstart" in window || window.innerWidth <= 768;
        
        data.blog.forEach(post => {
            const div = document.createElement("div");
            // クラスはこれだけでOK。CSS側で擬似要素が自動的にガラスを生成します。
            div.className = 'blog-item liquid-card'; 

            if (!isMobile) {
                // Vanilla-tiltの設定（変更なし）
                div.setAttribute("data-tilt", "");
                div.setAttribute("data-tilt-max", "10");
                div.setAttribute("data-tilt-speed", "400");
                div.setAttribute("data-tilt-glare", "true");
                div.setAttribute("data-tilt-max-glare", "0.5"); // グレアを強めに
                div.setAttribute("data-tilt-perspective", "1000");
            }

            // 中身のHTML（変更なし）
            div.innerHTML = `
                <div style="position: relative; z-index: 2;">
                    <h3 class="liquid-text-main">${post.title}</h3>
                    <p class="liquid-text-sub">${post.description}</p>
                </div>
                <i data-lucide="arrow-right" class="card-icon" style="position: relative; z-index: 2;"></i>
            `;

            div.onclick = () => (window.location.href = post.url);
            blogList.appendChild(div);
        });

        if (!isMobile && window.VanillaTilt) {
            VanillaTilt.init(document.querySelectorAll(".blog-item"));
        }
    }

    const musicCard = document.getElementById("music-card");
    if (musicCard && data.music) {
        musicCard.innerHTML = `
            <div class="music-bg-blur" style="background-image: url('${data.music.cover}')"></div>
            <div class="music-content">
                <img src="${data.music.cover}" alt="Album Art" class="album-art">
                <div class="music-info">
                    <div class="music-title">${data.music.title}</div>
                    <div class="music-artist">${data.music.artist}</div>
                </div>
                ${data.music.spotifyIcon ? '<i data-lucide="music" class="spotify-logo"></i>' : ""}
            </div>
        `;
    }
}

function renderFallback() {
    renderContent({
        profile: { name: "Shiratama", role: "Web Developer" },
        socials: [{ name: "X", url: "#" }],
        blog: [{ title: "Welcome", description: "Portfolio site is ready." }],
        music: { title: "Music", artist: "Artist", cover: "", spotifyIcon: true }
    });
}

function initIcons() { lucide.createIcons(); }

function initAnimations() {
    const revealElements = document.querySelectorAll(".gs-reveal");
    revealElements.forEach(element => {
        gsap.to(element, {
            scrollTrigger: {
                trigger: element,
                start: "top 85%",
                toggleActions: "play none none reverse"
            },
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out"
        });
    });
}

const dockItems = document.querySelectorAll(".dock-item:not(#theme-toggle)");
dockItems.forEach(item => {
    item.addEventListener("click", () => {
        dockItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");
    });
});