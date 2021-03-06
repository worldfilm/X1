/*
 * jQuery Slot Machine v2.1.0
 * https://github.com/josex2r/jQuery-SlotMachine
 *
 * Copyright 2014 Jose Luis Represa
 * Released under the MIT license
 */
(function($, window, document, undefined) {

  var pluginName = "slotMachine",
	    defaults = {
	      active: 0, //Active element [Number]
	      delay: 200, //Animation time [Number]
	      auto: false, //Repeat delay [false||Number]
				spins: 5, //Number of spins when auto [Number]
	      randomize: null, //Randomize function, must return a number with the selected position
	      complete: null, //Callback function(result)
	      stopHidden: true, //Stops animations if the element isn´t visible on the screen
        direction: 'up' //Animation direction ['up'||'down']
	    };

  var FX_FAST = 'slotMachineBlurFast',
	    FX_NORMAL = 'slotMachineBlurMedium',
	    FX_SLOW = 'slotMachineBlurSlow',
	    FX_GRADIENT = 'slotMachineGradient',
	    FX_STOP = FX_GRADIENT;

  //Set required styles, filters and masks
  $(document).ready(function() {

    var slotMachineBlurFilterFastString = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="0" height="0">' +
      '<filter id="slotMachineBlurFilterFast">' +
      '<feGaussianBlur stdDeviation="5" />' +
      '</filter>' +
      '</svg>#slotMachineBlurFilterFast';

    var slotMachineBlurFilterMediumString = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="0" height="0">' +
      '<filter id="slotMachineBlurFilterMedium">' +
      '<feGaussianBlur stdDeviation="3" />' +
      '</filter>' +
      '</svg>#slotMachineBlurFilterMedium';

    var slotMachineBlurFilterSlowString = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="0" height="0">' +
      '<filter id="slotMachineBlurFilterSlow">' +
      '<feGaussianBlur stdDeviation="1" />' +
      '</filter>' +
      '</svg>#slotMachineBlurFilterSlow';

    var slotMachineFadeMaskString = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="0" height="0">' +
      '<mask id="slotMachineFadeMask" maskUnits="objectBoundingBox" maskContentUnits="objectBoundingBox">' +
      '<linearGradient id="slotMachineFadeGradient" gradientUnits="objectBoundingBox" x="0" y="0">' +
      '<stop stop-color="white" stop-opacity="0" offset="0"></stop>' +
      '<stop stop-color="white" stop-opacity="1" offset="0.25"></stop>' +
      '<stop stop-color="white" stop-opacity="1" offset="0.75"></stop>' +
      '<stop stop-color="white" stop-opacity="0" offset="1"></stop>' +
      '</linearGradient>' +
      '<rect x="0" y="-1" width="1" height="1" transform="rotate(90)" fill="url(#slotMachineFadeGradient)"></rect>' +
      '</mask>' +
      '</svg>#slotMachineFadeMask';

    //CSS classes
    $('body').append('<style>' +
      '.' + FX_FAST + '{-webkit-filter: blur(5px);-moz-filter: blur(5px);-o-filter: blur(5px);-ms-filter: blur(5px);filter: blur(5px);filter: url("data:image/svg+xml;utf8,' + slotMachineBlurFilterFastString + '");filter:progid:DXImageTransform.Microsoft.Blur(PixelRadius="5")}' +
      '.' + FX_NORMAL + '{-webkit-filter: blur(3px);-moz-filter: blur(3px);-o-filter: blur(3px);-ms-filter: blur(3px);filter: blur(3px);filter: url("data:image/svg+xml;utf8,' + slotMachineBlurFilterMediumString + '");filter:progid:DXImageTransform.Microsoft.Blur(PixelRadius="3")}' +
      '.' + FX_SLOW + '{-webkit-filter: blur(1px);-moz-filter: blur(1px);-o-filter: blur(1px);-ms-filter: blur(1px);filter: blur(1px);filter: url("data:image/svg+xml;utf8,' + slotMachineBlurFilterSlowString + '");filter:progid:DXImageTransform.Microsoft.Blur(PixelRadius="1")}' +
      '.' + FX_GRADIENT + '{' +
      '-webkit-mask-image: -webkit-gradient(linear, left top, left bottom, color-stop(0%, rgba(0,0,0,0)), color-stop(25%, rgba(0,0,0,1)), color-stop(75%, rgba(0,0,0,1)), color-stop(100%, rgba(0,0,0,0)) );' +
      'mask: url("data:image/svg+xml;utf8,' + slotMachineFadeMaskString + '");' +
      '}' +
      '</style>');

  });

  //Required easing functions
  if (typeof $.easing.easeOutBounce !== 'function') {
    //From jQuery easing, extend jQuery animations functions
    $.extend($.easing, {
      easeOutBounce: function(x, t, b, c, d) {
        if ((t /= d) < (1 / 2.75)) {
          return c * (7.5625 * t * t) + b;
        } else if (t < (2 / 2.75)) {
          return c * (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75) + b;
        } else if (t < (2.5 / 2.75)) {
          return c * (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375) + b;
        } else {
          return c * (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375) + b;
        }
      },
    });
  }


  function Timer(fn, delay) {
    var startTime,
      self = this,
      timer,
      _fn = fn,
      _args = arguments,
      _delay = delay;

    this.running = false;

    this.onpause = function() {};
    this.onresume = function() {};

    this.cancel = function() {
      this.running = false;
      clearTimeout(timer);
    };

    this.pause = function() {
      if (this.running) {
        delay -= new Date().getTime() - startTime;
        this.cancel();
        this.onpause();
      }
    };

    this.resume = function() {
      if (!this.running) {
        this.running = true;
        startTime = new Date().getTime();

        timer = setTimeout(function() {
          _fn.apply(self, Array.prototype.slice.call(_args, 2, _args.length)); //Execute function with initial arguments, removing (fn & delay)
        }, delay);

        this.onresume();
      }
    };

    this.reset = function() {
      this.cancel();
      this.running = true;
      delay = _delay;
      timer = setTimeout(function() {
        _fn.apply(self, Array.prototype.slice.call(_args, 2, _args.length)); //Execute function with initial arguments, removing (fn & delay)
      }, _delay);
    };

    this.add = function(extraDelay) {
      this.pause();
      delay += extraDelay;
      this.resume();
    };

    this.resume();
  }


  /**
   * @desc PUBLIC - Makes Slot Machine animation effect
   * @param DOM element - Html element
   * @param object settings - Plugin configuration params
   * @return jQuery node - Returns jQuery selector with some new functions (shuffle, stop, next, auto, active)
   */
  function SlotMachine(element, options) {
    this.element = element;
    this.settings = $.extend({}, defaults, options);
    this.defaults = defaults;
    this.name = pluginName;

    //jQuery selector
    this.$slot = $(element);
    //Slot Machine elements
    this.$tiles = this.$slot.children();
    //Container to wrap $tiles
    this.$container = null;
    //Min marginTop offset
    this._minTop = null;
    //Max marginTop offset
    this._maxTop = null;
    //First element (the last of the html container)
    this._$fakeFirstTile = null;
    //Last element (the first of the html container)
    this._$fakeLastTile = null;
    //Timeout recursive function to handle auto (settings.auto)
    this._timer = null;
    //Callback function
    this._oncompleteStack = [this.settings.complete];
    //Number of spins left before stop
    this._spinsLeft = null;
    //Future result
    this.futureActive = null;
    //Machine is running?
    this.isRunning = false;
    //Machine is stopping?
    this.isStopping = false;
    //Current active element
    this.active = this.settings.active;

    this.$slot.css('overflow', 'hidden');

    //Validate active index
    if (this.settings.active < 0 || this.settings.active >= this.$tiles.length) {
      this.settings.active = 0;
      this.active = 0;
    }

    //Wrap elements inside $container
    this.$container = this.$tiles.wrapAll('<div class="slotMachineContainer" />').parent();

    //Set max top offset
    this._maxTop = -this.$container.height();

    //Add the last element behind the first to prevent the jump effect
    this._$fakeFirstTile = this.$tiles.last().clone();
    this._$fakeLastTile = this.$tiles.first().clone();

    this.$container.prepend(this._$fakeFirstTile);
    this.$container.append(this._$fakeLastTile);

    //Set min top offset
    this._minTop = -this._$fakeFirstTile.outerHeight();

    //Direction parammeters
    this._direction = {
      selected: this.settings.direction === 'down' ? 'down' : 'up',
      up: {
        initial: this.getTileOffset(this.active),
        first: 0,
        last: this.getTileOffset(this.$tiles.length),
        to: this._maxTop,
        firstToLast: this.getTileOffset(this.$tiles.length),
        lastToFirst: 0
      },
      down: {
        initial: this.getTileOffset(this.active),
        first: this.getTileOffset(this.$tiles.length),
        last: 0,
        to: this._minTop,
        firstToLast: this.getTileOffset(this.$tiles.length),
        lastToFirst: 0
      },
      get: function(param){return this[this.selected][param];}
    };

    //Show active element
    this.$container.css('margin-top', this._direction.get('initial'));

    //Start auto animation
    if (this.settings.auto !== false) {
      if (this.settings.auto === true) {
        this.shuffle();
      } else {
        this.auto();
      }
    }
  }

  /**
   * @desc PUBLIC - Custom setTimeout using requestAnimationFrame
   * @param function cb - Callback
   * @param Number timeout - Timeout delay
   */
  SlotMachine.prototype.raf = function(cb, timeout) {
    var _raf = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame,
        startTime = new Date().getTime(),
        _rafHandler = function(/*timestamp*/){
          var drawStart = new Date().getTime(),
              diff = drawStart - startTime;

          if(diff < timeout){
            _raf(_rafHandler);
          }else if(typeof cb === 'function'){
            cb();
          }
        };

    _raf(_rafHandler);
  };

  /**
   * @desc PUBLIC - Get element offset top
   * @param Number index - Element position
   * @return Number - Negative offset in px
   */
  SlotMachine.prototype.getTileOffset = function(index) {
    var offset = 0;
    for (var i = 0; i < index; i++) {
      offset += this.$tiles.eq(i).outerHeight();
    }
    return -offset + this._minTop;
  };

  /**
   * @desc PUBLIC - Get current showing element index
   * @return Number - Element index
   */
  SlotMachine.prototype.getVisibleTile = function() {
    var firstTileHeight = this.$tiles.first().height(),
      	containerMarginTop = parseInt(this.$container.css('margin-top').replace(/px/, ''), 10);

    return Math.abs(Math.round(containerMarginTop / firstTileHeight)) - 1;
  };

  /**
   * @desc PUBLIC - Changes randomize function
   * @param function|Number - Set new randomize function
   */
  SlotMachine.prototype.setRandomize = function(rnd) {
    if (typeof rnd === 'number') {
      this.settings.randomize = function() {
        return rnd;
      };
    } else {
      this.settings.randomize = rnd;
    }
  };

  /**
   * @desc PUBLIC - Get random element different than last shown
   * @param boolean cantBeTheCurrent - true||undefined if cant be choosen the current element, prevents repeat
   * @return Number - Element index
   */
  SlotMachine.prototype.getRandom = function(cantBeTheCurrent) {
    var rnd,
      	removePrevious = cantBeTheCurrent || false;
    do {
      rnd = Math.floor(Math.random() * this.$tiles.length);
    } while ((removePrevious && rnd === this.active) && rnd >= 0);

    return rnd;
  };

  /**
   * @desc PUBLIC - Get random element based on the custom randomize function
   * @return Number - Element index
   */
  SlotMachine.prototype.getCustom = function() {
    var choosen;
    if (this.settings.randomize !== null && typeof this.settings.randomize === 'function') {
      var index = this.settings.randomize.apply(this, [this.active]);
      if (index < 0 || index >= this.$tiles.length) {
        index = 0;
      }
      choosen = index;
    } else {
      choosen = this.getRandom();
    }
    return choosen;
  };

  /**
   * @desc PRIVATE - Get the previous element (no direction related)
   * @return Number - Element index
   */
  SlotMachine.prototype._getPrev = function() {
    var prevIndex = (this.active - 1 < 0) ? (this.$tiles.length - 1) : (this.active - 1);
    return prevIndex;
  };

  /**
   * @desc PRIVATE - Get the next element (no direction related)
   * @return Number - Element index
   */
  SlotMachine.prototype._getNext = function() {
    var nextIndex = (this.active + 1 < this.$tiles.length) ? (this.active + 1) : 0;
    return nextIndex;
  };

  /**
   * @desc PUBLIC - Get the previous element dor selected direction
   * @return Number - Element index
   */
  SlotMachine.prototype.getPrev = function() {
    return this._direction.selected === 'up' ? this._getPrev() : this._getNext();
  };

  /**
   * @desc PUBLIC - Get the next element
   * @return Number - Element index
   */
  SlotMachine.prototype.getNext = function() {
    return this._direction.selected === 'up' ? this._getNext() : this._getPrev();
  };

  /**
   * @desc PUBLIC - Set the spin direction
   * @return Object - Direction data
   */
  SlotMachine.prototype.setDirection = function(direction) {
    if (this.isRunning) {
      return;
    }
    this._direction.selected = direction === 'down' ? 'down' : 'up';
    return this._direction[this._direction.selected];
  };

  /**
   * @desc PRIVATE - Set CSS classes to make speed effect
   * @param string FX_SPEED - Element speed [FX_FAST_BLUR||FX_NORMAL_BLUR||FX_SLOW_BLUR||FX_STOP]
   * @param string||boolean fade - Set fade gradient effect
   */
  SlotMachine.prototype._setAnimationFX = function(FX_SPEED, fade) {
	  //IE 出错跳过
	  if($.browser.msie != true){
		    this.raf(function() {
		        this.$tiles.removeClass([FX_FAST, FX_NORMAL, FX_SLOW].join(' ')).addClass(FX_SPEED);

		        if (fade !== true || FX_SPEED === FX_STOP) {
		          this.$slot.add(this.$tiles).removeClass(FX_GRADIENT);
		        } else {
		          this.$slot.add(this.$tiles).addClass(FX_GRADIENT);
		        }
		      }.bind(this), this.settings.delay / 4);		  
	  }
  };

  /**
   * @desc PRIVATE - Reset active element position
   */
  SlotMachine.prototype._resetPosition = function() {
    this.$container.css('margin-top', this._direction.get('initial'));
  };

  /**
   * @desc PRIVATE - Checks if the machine is on the screen
   * @return Number - Returns true if machine is on the screen
   */
  SlotMachine.prototype.isVisible = function() {
    //Stop animation if element is [above||below] screen, best for performance
    var above = this.$slot.offset().top > $(window).scrollTop() + $(window).height(),
      	below = $(window).scrollTop() > this.$slot.height() + this.$slot.offset().top;

    return !above && !below;
  };

  /**
   * @desc PUBLIC - SELECT previous element relative to the current active element
   * @return Number - Returns result index
   */
  SlotMachine.prototype.prev = function() {
    this.futureActive = this.getPrev();
    this.isRunning = true;
    this.stop(false);
    return this.futureActive;
  };

  /**
   * @desc PUBLIC - SELECT next element relative to the current active element
   * @return Number - Returns result index
   */
  SlotMachine.prototype.next = function() {
    this.futureActive = this.getNext();
    this.isRunning = true;
    this.stop(false);
    return this.futureActive;
  };

  /**
   * @desc PUBLIC - Starts shuffling the elements
   * @param Number repeations - Number of shuffles (undefined to make infinite animation
   * @return Number - Returns result index
   */
  SlotMachine.prototype.shuffle = function(spins, onComplete) {
    var self = this;

    if (onComplete !== undefined) {
      this._oncompleteStack[1] = onComplete;
    }

    this.isRunning = true;
    var delay = this.settings.delay;

    if (this.futureActive === null) {
      //Get random or custom element
      var rnd = this.getCustom();
      this.futureActive = rnd;
    }

    //Decreasing spin
    if (typeof spins === 'number') {
      //Change delay and speed
      switch (spins) {
        case 1:
        case 2:
          this._setAnimationFX(FX_SLOW, true);
          break;
        case 3:
        case 4:
          this._setAnimationFX(FX_NORMAL, true);
          delay /= 1.5;
          break;
        default:
          this._setAnimationFX(FX_FAST, true);
          delay /= 2;
      }
      //Infinite spin
    } else {
      //Set animation effects
      this._setAnimationFX(FX_FAST, true);
      delay /= 2;
    }

    //Perform animation
    if (!this.isVisible() && this.settings.stopHidden === true) {
      spins = 0;
      self.stop();
    } else {
      this.$container.animate({
        marginTop: this._direction.get('to')
      }, delay, 'linear', function() {
        //Reset top position
        self.$container.css('margin-top', self._direction.get('first'));

        if (spins - 1 <= 0) {
          self.stop();
        } else {
          //Repeat animation
          self.shuffle(spins - 1);
        }
      });
    }

    return this.futureActive;
  };

  /**
   * @desc PUBLIC - Stop shuffling the elements
   * @return Number - Returns result index
   */
  SlotMachine.prototype.stop = function(showGradient) {
    if (!this.isRunning) {
      return;
    } else if (this.isStopping) {
      return this.futureActive;
    }
    var self = this;

    //Stop animation NOW!!!!!!!
    this.$container.clearQueue().stop(true, false);

    this._setAnimationFX(FX_SLOW, showGradient === undefined ? true : showGradient);

    this.isRunning = true;
    this.isStopping = true;

    //Set current active element
    this.active = this.getVisibleTile();

    //Check direction to prevent jumping
    if (this.futureActive > this.active) {
      //We are moving to the prev (first to last)
      if (this.active === 0 && this.futureActive === this.$tiles.length - 1) {
        this.$container.css('margin-top', this._direction.get('firstToLast'));
      }
    } else {
      //We are moving to the next (last to first)
      if (this.active === this.$tiles.length - 1 && this.futureActive === 0) {
        this.$container.css('margin-top', this._direction.get('lastToFirst'));
      }
    }

    //Update last choosen element index
    this.active = this.futureActive;

    //Get delay
    var delay = this.settings.delay * 3;

    //Perform animation
    this.$container.animate({
      marginTop: this.getTileOffset(this.active)
    }, delay, 'easeOutBounce', function() {

      self.isStopping = false;
      self.isRunning = false;
      self.futureActive = null;

      if (typeof self._oncompleteStack[0] === 'function') {
        self._oncompleteStack[0].apply(self, [self.active]);
      }
      if (typeof self._oncompleteStack[1] === 'function') {
        self._oncompleteStack[1].apply(self, [self.active]);
      }
    });

    //Disable blur
	  //IE 出错跳过
	  if($.browser.msie != true){
	    this.raf(function() {
	        this._setAnimationFX(FX_STOP, false);
	      }.bind(this), delay / 1.75);		  
	  }


    return this.active;
  };

  /**
   * @desc PUBLIC - Start auto shufflings, animation stops each 3 repeations. Then restart animation recursively
   */
  SlotMachine.prototype.auto = function() {
    var self = this;

    this._timer = new Timer(function() {
      if (typeof self.settings.randomize !== 'function') {
        self.futureActive = self.getNext();
      }
      self.isRunning = true;
      if (!self.isVisible() && self.settings.stopHidden === true) {
        self.raf(function() {
          self._timer.reset();
        }, 500);
      } else {
        self.shuffle(self.settings.spins, function() {
          self._timer.reset();
        });
      }

    }, this.settings.auto);
  };

  /*
   * Create new plugin instance if needed and return it
   */
  function _getInstance(element, options) {
    var machine;
    if (!$.data(element[0], 'plugin_' + pluginName)) {
      machine = new SlotMachine(element, options);
      $.data(element[0], 'plugin_' + pluginName, machine);
    } else {
      machine = $.data(element[0], 'plugin_' + pluginName);
    }
    return machine;
  }

  /*
   * Chainable instance
   */
  $.fn[pluginName] = function(options) {
    if (this.length === 1) {
      return _getInstance(this, options);
    } else {
			var $els = this;
      return $.map($els, function(el, index) {
				var $el = $els.eq(index);
        return _getInstance($el, options);
      });
    }
  };

})(jQuery, window, document);
