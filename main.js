// make kaboom functions global
kaboom.global()

// init kaboom context
init({
    fullscreen: true,
    crisp: true,
    clearColor: rgb(0.2, 0.3, 0.3)
})

// global variables and constants
const screenUnitX = width() / 10
const screenUnitY = height() / 10

const bulletBaseSpeed = 1500
let bulletSpeedTable = []

const emacsBaseSpeed = 1000
let emacsSpeedTable = []

// no need to have a speed table since there can be only 1 on screen
const powerupBaseSpeed = 600
let powerupSpeed

// increments ids until all bullets are despawned, in which case reset to zero
let bulletIdCounter = 0
let emacsIdCounter = 0

let highestScore = 0

loadSprite("hero", "./assets/sprites/Hero.png", {
    sliceX: 8,
    sliceY: 3,
    anims: {
        moveLeft: [9, 10, 11],
        moveRight: [13, 14, 15],
        moveUp: [1, 3],
        moveDown: [5, 7],
    },
})

loadSprite("power", "./assets/sprites/powers.png", {
    sliceX: 5,
    sliceY: 4
})

loadSprite("bullet", "./assets/sprites/ball.png")
loadSprite("emacs", "./assets/sprites/emacs.png")

// title screen ui
scene("title", () => {
    // loading assets
    // loadSound("move", "./assets/audio/moving.wav");
    // loadSound("select", "./assets/audio/selecting.wav");

    let optionsOffsetX = screenUnitX * 4.0
    let optionsOffsetY = screenUnitY * 3.5

    add([
        text("Video Game", 32),
        pos(3.5 * screenUnitX, 2 * screenUnitY)
    ])

    function addButton(txt, p, f) {

        const bg = add([
            pos(p),
            rect(1.65 * screenUnitX, 0.5 * screenUnitY),
            // origin("center"),
            color(0.2, 0.3, 0.3)
        ]);

        const option = add([
            text(txt, 28),
            pos(p),
            color(0, 0, 0),
        ]);

        let firstTime = true
        bg.action(() => {
            if (bg.isHovered()) {
                option.color = rgb(1, 1, 0);
                if (firstTime) {
                    firstTime = false
                }
                if (mouseIsClicked()) {
                    f()
                }
            } else {
                option.color = rgb(0, 0, 0);
                firstTime = true
            }
        });

    }

    addButton("Start", vec2(optionsOffsetX, optionsOffsetY), () => {
        go("main")
    })

    addButton("Options", vec2(optionsOffsetX, optionsOffsetY + 0.5 * screenUnitX), () => {
        alert("what options lol")
    })

    addButton("Quit", vec2(optionsOffsetX, optionsOffsetY + screenUnitX), () => {
        alert("yep cock")
    })
})

// ded lol
scene("death", (score) => {
    if (score > highestScore) {
        highestScore = score
    }
    add([
        text(`ded lol\n\nscore: ${score}\nhighest: ${highestScore}\n\nPress Space`, 82),
        pos(5 * screenUnitX, 5 * screenUnitY),
        origin("center")
    ])

    keyPress("space", () => {
        go("title")
    })
})

// main game scene
scene("main", () => {

    let score = 0

    layers([
        "game",
        "ui",
    ], "game")

    const player = add([
        sprite("hero", {
            animSpeed: 0.1, // time per frame (defaults to 0.1)
            frame: 5
        }),
        scale(4),
        pos(width() / 2, height() / 2),
        "player",
        {
            speed: 450,
            powerupStatus: 0,
            powerupTimer: 0
        }
    ])

    const hud = add([
        text("lole"),
        pos(10, 10),
        scale(2),
        layer("ui"),
        {
            objectCount: 0
        }
    ])

    // enemy spawn loop
    loop(0.5, () => {
        // might as well decrement player powerup timer here
        if (player.powerupTimer !== 0) {
            player.powerupTimer -= 0.5
        } else {
            player.powerupStatus = 0
        }


        let randPos = vec2(rand(0, width()), 0)


        let diffX = player.pos.x - randPos.x
        let diffY = player.pos.y - randPos.y

        let angle = Math.atan2(diffX, diffY)

        if (chance(0.95)) {
            let emacsId
            if (get("emacs").length === 0) {
                emacsIdCounter = 0
            }
            emacsId = emacsIdCounter
            emacsIdCounter++

            emacsSpeedTable[emacsId] = {
                x: Math.sin(angle) * emacsBaseSpeed,
                y: Math.cos(angle) * emacsBaseSpeed
            }

            // console.log(emacsSpeedTable);

            spawnEmacs(randPos, emacsId)

        } else if (get("powerup").length === 0) {
            // console.log("spawn powerup");
            powerupSpeed = {
                x: Math.sin(angle) * powerupBaseSpeed,
                y: Math.cos(angle) * powerupBaseSpeed
            }
            spawnPowerup(randPos)
        }
    })

    hud.action(() => {
        hud.text =
            `objCount: ${objCount()}`
            + `\t fps: ${Math.trunc(fps())}`
            + `\t score: ${score}`
            + `\t powerupStatus: ${player.powerupStatus}`
            + `\t powerupTimer: ${player.powerupTimer}`
    })

    action("bullet", (b) => {
        let index = b.id
        b.move(bulletSpeedTable[index].x, bulletSpeedTable[index].y)
        // remove the bullet if it's out of the scene for performance
        if (b.pos.y < 0
            || b.pos.y > height()
            || b.pos.x < 0
            || b.pos.x > width()) {
            destroy(b);
        }
    })

    action("emacs", (e) => {
        let index = e.id
        e.move(emacsSpeedTable[index].x, emacsSpeedTable[index].y)

        if (e.pos.y < 0
            || e.pos.y > height()
            || e.pos.x < 0
            || e.pos.x > width()) {
            emacsSpeedTable[index].x = emacsSpeedTable[index].x * -1
            emacsSpeedTable[index].y = emacsSpeedTable[index].y * -1
        }
    })

    action("powerup", (p) => {
        p.move(powerupSpeed.x, powerupSpeed.y)

        if (p.pos.y < 0
            || p.pos.y > height()
            || p.pos.x < 0
            || p.pos.x > width()) {
            destroy(p)
        }
    })

    collides("bullet", "enemy", (b, e) => {
        destroy(b);
        destroy(e);
        score++
    })

    collides("player", "enemy", (p, e) => {
        go("death", score)
    })

    collides("player", "powerup", (pl, po) => {
        player.powerupStatus = 1
        player.powerupTimer += 10
        destroy(po)
    })

    keyHandling(player)
})

function keyHandling(player) {

    keyDown("s", () => {
        if (player.curAnim === undefined) {

            player.stop()
            player.play("moveDown")
        }
        player.move(0, player.speed)

    })

    keyDown("w", () => {
        if (player.curAnim === undefined) {

            player.stop()
            player.play("moveUp")
        }
        player.move(0, -player.speed)

    })

    keyDown("a", () => {
        if (player.curAnim === undefined) {
            player.play("moveLeft")
        }
        player.move(-player.speed, 0)

    })

    keyDown("d", () => {
        if (player.curAnim === undefined) {
            player.play("moveRight")
        }
        player.move(player.speed, 0)

    })

    keyRelease(["w", "a", "s", "d"], () => {
        player.stop()
    })

    mouseClick(() => {
        shoot(player)
    })

    mouseDown(() => {
        // console.log(`mouse: ${[mousePos().x, mousePos().y]}`);
        // console.log(`player: ${[player.pos.x, player.pos.y]}`);
        // console.log(`diff: ${[mousePos().x - player.pos.x, mousePos().y - player.pos.y]}`);
        // console.log([bulletSpeedX, bulletSpeedY])
        // console.log(get("bullet").length);

        if (player.powerupStatus === 1) {
            shoot(player)
        }



    })

    keyPress("space", () => {
        console.log([player.pos.x, player.pos.y])
        console.log(player.frame)
    })
}

function shoot(player) {
    let bulletId
    if (get("bullet").length === 0) {
        bulletIdCounter = 0
    }
    bulletId = bulletIdCounter
    bulletIdCounter++

    let diffX = mousePos().x - player.pos.x
    let diffY = mousePos().y - player.pos.y

    let angle = Math.atan2(diffX, diffY)


    bulletSpeedTable[bulletId] = {
        x: Math.sin(angle) * bulletBaseSpeed,
        y: Math.cos(angle) * bulletBaseSpeed
    }

    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX < 0) {
            // console.log("left");
            player.stop()
            player.play("moveLeft")
        } else {
            // console.log("right");
            player.stop()
            player.play("moveRight")
        }
    } else {
        if (diffY > 0) {
            // console.log("down");
            player.stop()
            player.play("moveDown")
        } else {
            // console.log("up");
            player.stop()
            player.play("moveUp")
        }
    }

    spawnBullet(player.pos.clone(), bulletId)
}

function spawnBullet(position, id) {
    add([
        sprite("bullet"),
        scale(2),
        pos(position),
        "bullet",
        {
            id
        }
    ])
}

function spawnEmacs(position, id) {
    add([
        sprite("emacs"),
        scale(0.8),
        pos(position),
        "enemy",
        "emacs",
        {
            id
        }
    ])
}

function spawnPowerup(position) {
    add([
        sprite("power", {
            frame: 2
        }),
        scale(1.8),
        pos(position),
        "powerup",
    ])
}

// start the game
start("title")