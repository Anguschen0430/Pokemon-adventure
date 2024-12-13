document.addEventListener("DOMContentLoaded", () => {
    const player = document.getElementById("player");
    const boss = document.getElementById("boss");
    const playerHealthDisplay = document.getElementById("player-health");
    const bossHealthDisplay = document.getElementById("boss-health");
    let playerHealth = 100;
    let bossHealth = 50;

    let playerSpeed = 5; // 玩家移動速度
    let bossSpeed = 3; // Boss 移動速度
    let moveLeft = false;
    let moveRight = false;

    let bossDirection = Math.random() < 0.5 ? -1 : 1; // 初始方向
    boss.style.left = `${window.innerWidth / 2 - 30}px`;

    const bossHeartsContainer = document.getElementById("boss-hearts");
    const playerHeartsContainer = document.getElementById("player-hearts");

    updateHealthDisplay(playerHealth, playerHeartsContainer);
    updateHealthDisplay(bossHealth, bossHeartsContainer);



    // 寶可夢選擇邏輯
    const collectedPokemon = JSON.parse(localStorage.getItem("collectedPokemon") || "[]");
    const pokemonButtons = document.getElementById("pokemon-buttons");

    collectedPokemon.forEach(id => {
        const img = document.createElement("img");
        img.src = `./pokemon/${id.toString().padStart(3, '0')}.gif`;
        img.dataset.id = id;
        img.addEventListener("click", () => {
            player.style.backgroundImage = `url('./pokemon/${id.toString().padStart(3, '0')}.gif')`;
            document.getElementById("pokemon-selection").style.display = "none";
            player.style.left = `${window.innerWidth / 2 - boss.offsetWidth / 2}px`;
            setInterval(() => {
                createBullet(boss, "down", 40, true);
            }, 3000);
            updateBossPosition();
        });
        pokemonButtons.appendChild(img);
    });

    // 玩家移動邏輯
    document.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") moveLeft = true;
        if (event.key === "ArrowRight") moveRight = true;
    });

    document.addEventListener("keyup", (event) => {
        if (event.key === "ArrowLeft") moveLeft = false;
        if (event.key === "ArrowRight") moveRight = false;
    });

    function checkGameOver() {
        if (playerHealth <= 0 || bossHealth <= 0) {
            const overlay = document.getElementById('game-overlay');
            const resultGif = document.getElementById('result-gif');
            const resultText = document.getElementById('result-text');
    
            if (playerHealth <= 0) {
                resultGif.src = './gif/loss.gif';
                resultText.textContent = '你輸了！';
            } else if (bossHealth <= 0) {
                resultGif.src = './gif/victory.gif';
                resultText.textContent = '你贏了！';
            }
    
            overlay.classList.remove('hidden');
    
            // 重新選擇寶可夢
            setTimeout(() => {
                location.reload(); // 刷新頁面重新選擇
            }, 5000);
        }
    }
    

    function updatePlayerPosition() {
        const rect = player.getBoundingClientRect();
        if (moveLeft && rect.left > 0) {
            player.style.left = `${parseInt(player.style.left || "50%") - playerSpeed}px`;
        }
        if (moveRight && rect.right < window.innerWidth) {
            player.style.left = `${parseInt(player.style.left || "50%") + playerSpeed}px`;
        }
    }

    // Boss 隨機左右移動
    function updateBossPosition() {
        let currentLeft = parseInt(boss.style.left || "0", 10); // 取得目前位置並確保是數值

        // 持續移動一段隨機時間
        const duration = Math.random() * 2 + 1; // 1 到 2 秒
        const intervalTime = 20; // 每 20ms 更新一次位置
        const steps = Math.floor(duration * 1000 / intervalTime); // 計算移動步數
        let stepCount = 0;

        // 開始移動
        const moveInterval = setInterval(() => {
            if (stepCount >= steps) {
                clearInterval(moveInterval); // 時間到了，停止當前方向的移動

                // 隨機選擇新方向
                bossDirection = Math.random() < 0.5 ? -1 : 1;
                stepCount = 0;

                // 開始下一次移動
                updateBossPosition();
                return;
            }
            else{
                console.log(stepCount, steps);
                currentLeft = Math.max(0, Math.min(window.innerWidth - boss.offsetWidth, currentLeft + bossSpeed * bossDirection));
                boss.style.left = `${currentLeft}px`;
                stepCount++;
            }
        }, intervalTime);
    }
    
    
    // 玩家發射子彈
    document.addEventListener("keydown", (event) => {
        if (event.code === "Space") {
            createBullet(player, "up", 10, false);
        }
    });

    // 子彈創建邏輯
    function createBullet(shooter, direction, damage, isboss) {
        const bullet = document.createElement("div");
        bullet.className = "bullet";
        bullet.style.position = "absolute";
        bullet.style.width = "20px";
        bullet.style.height = "40px";
        if (isboss) {
            bullet.style.backgroundImage = "url('./gif/attack.gif')";
        } else {
            bullet.style.backgroundImage = "url('./gif/bullet.gif')";
        }
        bullet.style.backgroundSize = "contain";
        bullet.style.backgroundRepeat = "no-repeat";
        bullet.style.left = `${shooter.getBoundingClientRect().left + shooter.offsetWidth / 2 - 10}px`;
        bullet.style.top = direction === "up"
            ? `${shooter.getBoundingClientRect().top}px`
            : `${shooter.getBoundingClientRect().bottom}px`;
        document.body.appendChild(bullet);

        const interval = setInterval(() => {
            const rect = bullet.getBoundingClientRect();
            if (direction === "up" && rect.bottom < 0) {
                bullet.remove();
                clearInterval(interval);
            } else if (direction === "down" && rect.top > window.innerHeight) {
                bullet.remove();
                clearInterval(interval);
            } else if (checkCollision(bullet, shooter === player ? boss : player)) {

                bullet.remove();

                if (shooter === player) {
                    bossHealth -= damage;
                    updateHealthDisplay(bossHealth, bossHeartsContainer);
                } else {
                    playerHealth -= damage;
                    updateHealthDisplay(playerHealth, playerHeartsContainer);
                }
                
                checkGameOver();
                
                clearInterval(interval);
                if (shooter === player) {
                    bossHealth -= damage;
                    bossHealthDisplay.textContent = bossHealth;
                } else {
                    playerHealth -= damage;
                    playerHealthDisplay.textContent = playerHealth;
                }
            } else {
                bullet.style.top = `${rect.top + (direction === "up" ? -5 : 5)}px`;
            }
        }, 20);
    }

    // 碰撞檢測
    function checkCollision(bullet, target) {
        const bulletRect = bullet.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        return !(
            bulletRect.right < targetRect.left ||
            bulletRect.left > targetRect.right ||
            bulletRect.bottom < targetRect.top ||
            bulletRect.top > targetRect.bottom
        );
    }

    // 遊戲主迴圈
    function gameLoop() {
        updatePlayerPosition();
        requestAnimationFrame(gameLoop);
    }

    gameLoop();
});

document.getElementById('back-button').addEventListener('click', () => {
    window.location.href = './game.html';
});

function updateHealthDisplay(health, container) {
    container.innerHTML = ''; // 清空
    const fullHearts = Math.floor(health / 20);
    const hasHalfHeart = health % 20 >= 10;

    // 添加完整的心
    for (let i = 0; i < fullHearts; i++) {
        const heart = document.createElement('div');
        heart.className = 'heart';
        container.appendChild(heart);
    }

    // 添加半顆心
    if (hasHalfHeart) {
        const halfHeart = document.createElement('div');
        halfHeart.className = 'half-heart';
        container.appendChild(halfHeart);
    }
}