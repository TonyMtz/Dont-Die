'use strict';

var Play = module.exports = function() {
  Phaser.State.call(this);
};

Play.prototype = Object.create(Phaser.State.prototype);
Play.prototype.constructor = Play;

var Room = require('../entities/room');
var Player = require('../entities/player');
var Mob = require('../entities/mob');

Play.prototype.map = {
  level: null,
  size: 19,
  tile: {
    height: 32,
    width: 32
  },
  walkable: null,
  warps: {
    start: {
      id: 'start',
      x: 0,
      y: 0
    },
    end: {
      id: 'end',
      x: 0,
      y: 0
    }
  }
};

Play.prototype.player = new Player(20, 'joan', 'male');

Play.prototype.updateStats = function() {
  var statusBar = document.getElementById("status");
  statusBar.innerHTML = '';

  function addText(label, value) {
    var span = document.createElement('span');
    span.innerHTML= label + ': <strong>' + value + '</strong>';
    statusBar.appendChild(span);
  }

  addText('Level', this.player.stats.level);
  addText('HP', this.player.stats.hp);
  addText('SP', this.player.stats.sp);
  addText('STR', this.player.stats.str);
  addText('DEF', this.player.stats.def);
  addText('$', this.player.stats.money);
};

Play.prototype.render = function() {
  this.game.time.advancedTiming = true;
  this.game.debug.text(this.game.time.fps || '--', window.innerWidth-40, window.innerHeight-10, "#ffffff");
  this.updateStats();
};

Play.prototype.createMobs = function() {
  this.mobs = this.game.add.group();
  this.mobs.entities = [];
  this.mobs.enableBody = true;
  this.mobs.physicsBodyType = Phaser.Physics.ARCADE;

  var mobID = 0;

  for(var i = 0; i< this.map.size; i++) {
    for(var j = 0; j< this.map.size; j++) {
      if(this.map.walkable[i][j]) {
        if(Math.floor((Math.random() * 100) + 1) > 95) {
          var mobBaseLevel = Math.floor((Math.random() * 3)),
              o = mobBaseLevel * 3,
              mobSprite = this.mobs.create(i * this.map.tile.width, j * this.map.tile.width, 'mobs', 1);

          mobSprite.animations.add('walk_left', [12 + o, 13 + o, 14 + o], 10, true);
          mobSprite.animations.add('walk_right', [24 + o, 25 + o, 26 + o], 10, true);
          mobSprite.animations.add('walk_up', [36 + o, 37 + o, 38 + o], 10, true);
          mobSprite.animations.add('walk_down', [0 + o, 1 + o, 2 + o], 10, true);
          mobSprite.animations.add('damage', [0,1,2], 10, true);
          mobSprite.animations.add('attack', [0,1,2], 10, true);

          this.mobs.entities.push(new Mob(mobID++, this.game, this.player, i, j, (i*j)+i, i, {x: this.map.size, y: this.map.size}, mobSprite, this.mobs.entities, this.map.walkable));
        }
      }
    }
  }
};

Play.prototype.drawMaze = function() {
  var self = this,
      map_width = (this.map.size+1) * this.map.tile.width,
      map_height = (this.map.size+1) * this.map.tile.height;

  this.game.world.setBounds(0, 0, map_width, map_height);

  this.map.level = new Room('maze', this.map.size);
  this.map.level.init();

  this.map.walkable = new Array(this.map.size);
  for(var i = 0; i< this.map.size; i++) {
    this.map.walkable[i] = new Array(this.map.size);
  }

  this.map.level.map.iterate(function(type, y, x) {
    self.map.walkable[x][y] = true;

    switch(type) {
      case 1:
        var textureModifier = Math.floor(Math.random() * 3) + 1;

        if(((Math.random() * 100) + 1) > 95){
          self.walls.create(x * self.map.tile.width, y * self.map.tile.height, 'tiles', 223+textureModifier);
        }

        break;
      case 2:
        self.walls.create(x * self.map.tile.width, y * self.map.tile.height, 'tiles', 403);
        self.map.warps.start.x = x;
        self.map.warps.start.y = y;
        break;
      case 3:
        self.walls.create(x * self.map.tile.width, y * self.map.tile.height, 'tiles', 420);
        self.map.warps.end.x = x;
        self.map.warps.end.y = y;
        break;
      default:
        self.walls.create(x * self.map.tile.width, y * self.map.tile.height, 'tiles', 246);
        self.map.walkable[x][y] = false;
    }
  });

  this.createMobs();
  this.player.sprite.position.x = self.map.warps.start.x * self.map.tile.width;
  this.player.sprite.position.y = self.map.warps.start.y * self.map.tile.height;
  this.player.location.x = self.map.warps.start.x;
  this.player.location.y = self.map.warps.start.y;
  this.player.sprite.bringToTop();
};

Play.prototype.create = function() {
  this.timer = {
    turn: true
  };

  this.game.physics.startSystem(Phaser.Physics.ARCADE);
  this.game.stage.disableVisibilityChange = true;
  this.background = this.game.add.tileSprite(0, 0, 1984, 1984, 'tiles', 8);

  this.walls = this.game.add.group();
  this.walls.enableBody = true;
  this.walls.physicsBodyType = Phaser.Physics.ARCADE;

  this.player.sprite = this.game.add.sprite(this.player.width, this.player.height, 'avatar');
  this.game.physics.enable(this.player.sprite, Phaser.Physics.ARCADE);
  this.game.camera.follow(this.player.sprite);
  this.player.sprite.body.setSize(12, 16, 2, 0);
  this.player.sprite.position.x = this.player.location.x * this.player.width;
  this.player.sprite.position.y = this.player.location.y * this.player.height;
  this.player.sprite.bringToTop();

  this.player.sprite.animations.add('stand', [0], 1, false);
  this.player.sprite.animations.add('walk_left', [4,5,6,7], 10, true);
  this.player.sprite.animations.add('walk_right', [8,9,10,11], 10, true);
  this.player.sprite.animations.add('walk_up', [12,13,14,15], 10, true);
  this.player.sprite.animations.add('walk_down', [0,1,2,3], 10, true);
  this.player.sprite.animations.add('damage', [16,17,18,19], 10, true);
  this.player.sprite.animations.add('attack', [20,21,22,23], 10, true);

  this.drawMaze();

  this.cursors = this.game.input.keyboard.createCursorKeys();
  this.keys = {
    spaceBar: this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR),
    escape: this.game.input.keyboard.addKey(Phaser.Keyboard.ESC)
  }
};

Play.prototype.startMoving = function() {
  this.player.moving = true;
};

Play.prototype.stopMoving = function() {
  this.player.moving = false;
};

Play.prototype.validCell = function(x, y) {
  if(!this.map.walkable[x][y]) {
    return false;
  }

  for (var index in this.mobs.entities) {
    var mob = this.mobs.entities[index];

    if (mob.location.x === x && mob.location.y === y) {

      if(this.keys.spaceBar.isDown) {
        if(this.player.attack(mob)) {
          var animation = this.game.add.tween(mob.sprite);

          animation.to({alpha: 0.5}, 120, Phaser.Easing.linear, true, 0, 1, false);
          animation.to({alpha: 1}, 120, Phaser.Easing.linear, true, 0, 1, false);
          animation.start();
        }
      }

      return false;
    }
  }

  return true;
};

Play.prototype.checkWarps = function(x, y) {
  for (var index in this.map.warps) {
    var warp = this.map.warps[index];

    if(warp.x === x && warp.y === y) {
      console.log('Warp reached!', warp.id);
      // TODO: we should load a new map, depending on warp.id!!!
    }
  }
};

Play.prototype.movePlayer = function(left, top, action) {
  var locationBackup = {
    x: this.player.location.x,
    y: this.player.location.y
  };

  this.player.location.x += left;
  this.player.location.y += top;
  this.player.moving = true;

  if(this.player.location.x < 0) {
    this.player.location.x = 0;
  }

  if(this.player.location.y < 0) {
    this.player.location.y = 0;
  }

  if(this.player.location.x > this.map.size-1) {
    this.player.location.x = this.map.size-1;
  }

  if(this.player.location.y > this.map.size-1) {
    this.player.location.y = this.map.size-1;
  }

  if(!this.validCell(this.player.location.x, this.player.location.y)) {
    this.player.moving = false;
    this.player.location = locationBackup;
  } else {
    this.checkWarps(this.player.location.x, this.player.location.y);

    var animation = this.game.add.tween(this.player.sprite).to(
      {
        x: this.player.location.x * this.map.tile.width,
        y: this.player.location.y * this.map.tile.height
      },
      200, Phaser.Easing.linear, true
    );

    animation.onStart.add(this.startMoving, this)
    animation.onComplete.addOnce(this.stopMoving, this);

    switch(action) {
      case 'attack':
        console.log('attack!');
        // trigger some magic!
        break;
    }
  }
};

Play.prototype.timerTick = function() {
  for(var index in this.mobs.entities) {
    var mob = this.mobs.entities[index];

    if(mob.isAlive()) {
      mob.chooseNextMove();
    } else {
      var textureModifier = Math.floor(Math.random() * 2) + 1;
      this.mobs.create(mob.location.x * this.map.tile.width, mob.location.y * this.map.tile.width, 'tiles', 240 + textureModifier);
      this.mobs.entities.splice(index, 1);
      mob.sprite.parent.remove(mob.sprite);
    }
  }

  this.timer.turn = true;
};

Play.prototype.update = function() {
  this.player.sprite.body.velocity.setTo(0, 0);

  if(this.timer.turn) {
    this.timer.turn = false;
    var self = this;
    setTimeout(function(){
      self.timerTick()
    }, 200);
  }

  if(!this.player.isAlive()) {
    console.log('You are dead!');
    window.location.reload();
  }

  if(!this.player.moving && this.player.isAlive()) {
    this.game.input.update();

    if(this.cursors.down.isDown) {
      this.movePlayer(0,1);
      this.player.sprite.animations.play('walk_down');
    } else if(this.cursors.up.isDown) {
      this.movePlayer(0,-1);
      this.player.sprite.animations.play('walk_up');
    } else if(this.cursors.left.isDown) {
      this.movePlayer(-1, 0);
      this.player.sprite.animations.play('walk_left');
    } else if(this.cursors.right.isDown) {
      this.movePlayer(1, 0);
      this.player.sprite.animations.play('walk_right');
    }

    if(this.keys.spaceBar.isDown) {
      this.movePlayer(0, 0, 'attack');
      this.player.sprite.animations.play('attack');
    }
  }
};
