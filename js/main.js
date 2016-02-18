window.onload = function() {
    // You might want to start with a template that uses GameStates:
    //     https://github.com/photonstorm/phaser/tree/master/resources/Project%20Templates/Basic
    
    // You can copy-and-paste the code from any of the examples at http://examples.phaser.io here.
    // You will need to change the fourth parameter to "new Phaser.Game()" from
    // 'phaser-example' to 'game', which is the id of the HTML element where we
    // want the game to go.
    // The assets (and code) can be found at: https://github.com/photonstorm/phaser/tree/master/examples/assets
    // You will need to change the paths you pass to "game.load.image()" or any other
    // loading functions to reflect where you are putting the assets.
    // All loading functions will typically all be found inside "preload()".
    
    "use strict";
    
    var game = new Phaser.Game(800, 600, Phaser.AUTO, 'game', { preload: preload, create: create, update: update, render: render } );
    
    function preload() {
        game.load.spritesheet('kiwi', 'assets/kiwi.png', 120, 100);
        game.load.image('grass', 'assets/grassblock.png');
        game.load.spritesheet('ball', 'assets/ball.png', 30, 30);
        game.load.audio('explosion', 'assets/explosion.mp3');
        game.load.audio('steps', 'assets/steps2.mp3');
        game.load.audio('jump', 'assets/lazer.wav');
    }
    
    var player;
    var platform;
    var cursors;
    var direction = 1;
    var maxSpeed = 500;
    var acceleration = 2400;
    var drag = 800;
    var bulletGroup;
    var bulletNumber = 1;
    var lastBulletShotAt;
    var upOrDown = game.rnd.integerInRange(0,1);
    var dead = false;
    var text = 0;
    var instr = 0;
    var counter = 0;
    var explosion;
    var steps;
    var jump;
    
    function create() {
        game.stage.backgroundColor = 0x4488cc;
        
        explosion = game.add.audio('explosion');
        steps = game.add.audio('steps');
        jump = game.add.audio('jump')
        
        game.physics.startSystem(Phaser.Physics.ARCADE);
                
        platform = game.add.group();
        platform.enableBody = true;
        for (var x = 0; x < game.width; x += 32) 
        {
            var groundBlock = game.add.sprite(x, game.height - 32, 'grass');
            game.physics.enable(groundBlock, Phaser.Physics.ARCADE);
            groundBlock.body.immovable = true;
            groundBlock.body.allowGravity = false;
            groundBlock.body.setSize(32,20,0,20);
            platform.add(groundBlock);
        }
        
        player = game.add.sprite(120, game.world.height - 200, 'kiwi');
        game.physics.arcade.enable(player);
        player.anchor.setTo(0.5, 1);
        player.body.setSize(120, 90);
        player.body.bounce.y = 0.2;
        player.body.gravity.y = 4000;
        player.body.collideWorldBounds = true;
        player.body.maxVelocity.setTo(maxSpeed, maxSpeed * 10);
        player.body.drag.setTo(drag, 0);
        player.animations.add('goLeft', [0, 1], 12, true);
        player.animations.add('goRight', [2, 3], 12, true);
        player.animations.add('faceRight', [4, 5], 5, true);
        player.animations.add('faceLeft', [6, 7], 5, true);
        player.animations.add('crouchLeft', [8], 2, true);
        player.animations.add('crouchRight', [9], 2, true);
        player.animations.add('jumpLeft', [7], 2, true);
        player.animations.add('jumpRight', [4], 2, true);
        player.animations.add('dead', [10], 2, true);

        cursors = game.input.keyboard.createCursorKeys();
        
        bulletGroup = game.add.group();
        for(var i = 0; i < 5; i++) {
            var bullet = game.add.sprite(0, 0, 'ball');
            bullet.animations.add('bulleets', [0, 1], 12, true);
            bulletGroup.add(bullet);
            bullet.anchor.setTo(0.5, 0.5);
            game.physics.enable(bullet, Phaser.Physics.ARCADE);
            bullet.kill();
        }
        
        game.time.events.add((game.rnd.frac() * Phaser.Timer.SECOND * 3) + 1, shoot, this);
        
        game.time.events.loop(Phaser.Timer.SECOND, updateCounter, this);
        text = game.add.text(30, 30, 'Time: 0', { font: "32px Arial", fill: "#ffffff", align: "left" });
        instr = game.add.text(550, 30, 'Avoid the kiwis!', { font: "32px Arial", fill: "#ffffff", align: "right" });
        
    }
    
    function update() {
        game.physics.arcade.collide(player, platform);
        game.physics.arcade.collide(player, bulletGroup, hit, null, this);
    
    if (dead)
    {
        player.angle += 5; 
        player.frame = 10;
    }
    if (cursors.left.isDown && !dead)
    {
        //  Move to the left
        player.body.setSize(120, 90);
        player.body.acceleration.x = -acceleration;
        direction = 0;
        if (player.body.touching.down)
        {
            player.animations.play('goLeft');
        }
        else
        {
            player.animations.play('jumpLeft');
        }
    }
    else if (cursors.right.isDown && !dead)
    {
        //  Move to the right
        player.body.setSize(120, 90);
        player.body.acceleration.x = acceleration;
        direction = 1;
        if (player.body.touching.down)
        {
            player.animations.play('goRight');
        }
        else
        {
            player.animations.play('jumpRight');
        }
    }
    else if (cursors.down.isDown && player.body.touching.down)
    {
        player.body.acceleration.x = 0;
        player.body.setSize(120, 50);
        steps.restart();
        if (direction == 0)
            player.animations.play('crouchLeft');
        else
            player.animations.play('crouchRight');            
    }

    else
    {
        player.body.acceleration.x = 0;
        player.body.setSize(120, 90);
        if (direction == 0)
            player.animations.play('faceLeft');
        else
            player.animations.play('faceRight');    
    }
    
    if (cursors.up.isDown && player.body.touching.down)
    {
        player.body.velocity.y = -1070;
        jump.play('', 0, 0.3);
    }
    
    }
    
    function shoot() {
    lastBulletShotAt = 0;
    if (game.time.now - lastBulletShotAt < 500) return;
    lastBulletShotAt = game.time.now;

    var bullet = bulletGroup.getFirstDead();
    if (bullet === null || bullet === undefined || dead) return;
    bullet.revive();

    bullet.checkWorldBounds = true;
    bullet.outOfBoundsKill = true;

    if (upOrDown == 1)
    {
        bullet.reset(780,500);
    }
    else
    {
        bullet.reset(780,580);
    }
    bullet.animations.play('bulleets');
    bullet.body.velocity.x = -300;
    bullet.body.velocity.y = 0;
    game.time.events.add((game.rnd.frac() * Phaser.Timer.SECOND * 4) + 1, shoot, this);
    upOrDown = game.rnd.integerInRange(0,1);
    }
    
    function hit() {
        explosion.play();
        player.anchor.setTo(0.5, 0.5);
        player.body.gravity.y = -100;
        player.body.velocity.y = -100;
        player.body.velocity.x = -100;
        dead = true;
        player.body.collideWorldBounds = false;
        player.checkWorldBounds = true;
        player.outOfBoundsKill = true;
        game.stage.backgroundColor = 0xc06f6f;
        instr.setText('nooooooooooooooooo')
    }
    
    function updateCounter() {
        if (!dead)
        {
        counter++;
        text.setText('Time: ' + counter);
        }
    }
    function render() {
        
    }
};
