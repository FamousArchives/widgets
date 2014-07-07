/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * @license MPL 2.0
 * @copyright Daniel Zaner 2014
 */

define(function(require, exports, module) {
    var View                = require('famous/core/View');
    var RenderNode          = require('famous/core/RenderNode');
    var Surface             = require('famous/core/Surface');
    var EventHandler        = require('famous/core/EventHandler');
    var Modifier            = require('famous/core/Modifier');
    var Transform           = require('famous/core/Transform');
    var StateModifier       = require('famous/modifiers/StateModifier');
    var RenderController    = require('famous/views/RenderController');
    var Timer               = require('famous/utilities/Timer');

    /**
     * A RenderController for rendering a 'spinner' -- a UI element to indicate that 
     * an action is "in progress" and that the user should wait
     *
     * Note: If a Spinner is positioned using an "origin" transform, the Spinner's ticks
     * will be positioned from their centers rather than a corner. Use the "originCompensation"
     * option to normalize the Spinner's radius.
     *
     * @class Spinner
     * @extends RenderController
     * @constructor
     *
     * @param {object} options overrides of deault options
     * @param {[Number, Number]} [options.size=[30,30]] Sets the size of the Spinner; Note: width should equal height
     * @param {Number} [options.ticks=12] Sets number of tick marks used to build the Spinner
     * @param {Number} [options.speed=100] Speed of the Spinners apparent rotation in milliseconds between tick opacity changes   
     * @param {boolean} [options.originCompensation=false] Is radius compensation needed because Spinner is positioned via an "origin" transform   
     * @param {object} [options.properties.color='grey'] Color of the Spinner
     *
     */
    function Spinner(options) {
        RenderController.apply(this, arguments);
        if (options) this.setOptions(options);

        this.spinnerState = Spinner.OFF;
        this.tickOpacityModifiers = [];

        var tickWidth = Math.round(this.options.size[0] * 0.05);
        var tickHeight = Math.round(this.options.size[1] * 0.3);
        var angleIncrement = 360 / this.options.ticks;
        var radiusCompensation = (this.options.originCompensation && (tickHeight / 2)) || 0;
        var circleRadius = this.options.size[0] * 0.55 - radiusCompensation;

        this.renderNode = new RenderNode();
        for (var i = 0; i < this.options.ticks; i++) {
            var p = {};
            p.x = (circleRadius * Math.cos((angleIncrement * i) * (Math.PI / 180)));
            p.y = (circleRadius * Math.sin((angleIncrement * i) * (Math.PI / 180)));
            var rotationModifier = new StateModifier({
                transform: Transform.rotateZ((Math.PI / 2) + (Math.PI / this.options.ticks * 2 * i))
            });
            var opacityModifier = new StateModifier({
                transform: Transform.translate(p.x, p.y, 0),
                opacity: (i / this.options.ticks + 0.1)
            });
            this.tickOpacityModifiers.push(opacityModifier);
            var surface = new Surface({
                size: [tickWidth, tickHeight],
                properties: {
                    backgroundColor: this.options.properties.color
                }
            });
            this.renderNode.add(opacityModifier).add(rotationModifier).add(surface);
        }
    }

    Spinner.OFF = 0;
    Spinner.ON  = 1;

    Spinner.prototype = Object.create(RenderController.prototype);
    Spinner.prototype.constructor = Spinner;

    Spinner.DEFAULT_OPTIONS = {
        size: [30, 30],
        ticks: 12,
        speed: 100,
        originCompensation: false,
        properties: {
            color: 'grey'
        }
    };

    /**
     * Set internal options, overriding any default options
     *
     * @method setOptions
     * @param {Object} [options] overrides of default options
     */
    Spinner.prototype.setOptions = function setOptions(options) {
        if (options.size !== undefined) this.options.size = options.size;
        if (options.ticks !== undefined) this.options.ticks = options.ticks;
        if (options.speed !== undefined) this.options.speed = options.speed;
        if (options.originCompensation !== undefined) this.options.originCompensation = options.originCompensation;
        if (options.properties !== undefined) {
            if (this.options.properties === undefined) this.options.properties = {};
            if (options.properties.color !== undefined) this.options.properties.color = options.properties.color;
        }
    };

    /**
     * Show the spinner and trigger the rotation animation
     *
     * @method start
     */
    Spinner.prototype.start = function start() {
        this.spinnerState = Spinner.ON;
        this.show(this.renderNode);
        Timer.setTimeout(this.incrementSpinner.bind(this), this.options.speed);
    };

    /**
     * Hide the spinner and halt the rotation animation
     *
     * @method stop
     */
    Spinner.prototype.stop = function stop() {
        this.spinnerState = Spinner.OFF;
        this.hide(this.renderNode);
    };


    // 
    /**
     * Increment the spinner's ticks' opacity to produce a rotation animation
     *
     * @method incrementSpinner
     */

    Spinner.prototype.incrementSpinner = function incrementSpinner() {
        this.tickOpacityModifiers.push(this.tickOpacityModifiers.shift());
        for (var i=0; i < this.tickOpacityModifiers.length; i++) {
            this.tickOpacityModifiers[i].setOpacity(i / this.options.ticks + 0.1);
        }
        if (this.spinnerState == Spinner.ON) {
            Timer.setTimeout(this.incrementSpinner.bind(this), this.options.speed);
        }
    };

    module.exports = Spinner;
});
