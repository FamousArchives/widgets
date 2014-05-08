/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Owner: mat@tinj.com
 * @license MPL 2.0
 * @copyright Tinj, Co. 2014
 */

define(function(require, exports, module) {
    var Surface         = require('famous/core/Surface');
    var Modifier        = require('famous/core/Modifier');
    var Transform       = require('famous/core/Transform');
    var View            = require('famous/core/View');
    var Timer           = require('famous/utilities/Timer');

    /**
     * A view for animating a loading spinner.
     * To fade the spinner, use a modifier to change to opacity.
     *
     * @class Spinner
     * @extends View
     * @constructor
     *
     * @param {object} options overrides of default options
     * @param {number} [options.lines=12] Number of spin lines in spinner.
     * @param {number} [options.lineWidth=9] Width of spin lines.
     * @param {number} [options.lineHeight=3] Height of spin lines.
     * @param {number} [options.centerOffset=15] Offset of spin lines from center.
     * @param {number} [options.borderRadius=2] Border radius of spin lines.
     * @param {string} [options.backgroundColor='white'] Spin line color.
     * @param {number} [options.spinSpeed=90] Spin speed.
     * @param {number} [options.fadeDuration=1000] Fade duration.
     * @param {string} [options.fadeCurve='easeOut'] Fade curve.
     */

    function Spinner() {
        View.apply(this, arguments);

        _createSpinLineSurfaces.call(this);
    }

    Spinner.prototype = Object.create(View.prototype);
    Spinner.prototype.constructor = Spinner;

    Spinner.DEFAULT_OPTIONS = {
        lines: 12,
        lineWidth: 9,
        lineHeight: 3,
        centerOffset: 15,
        borderRadius: 2,
        backgroundColor: 'white',
        spinSpeed: 90,
        fadeDuration: 1000,
        fadeCurve: 'easeOut'
    };

    function _createSpinLineSurfaces() {
        this.spinLineModifiers = [];
        this.rotateModifiers = [];

        var count = this.options.lines;
        var rotationOffset = 2 * Math.PI / count;

        for (var i = 0; i < count; i++) {
            var spinLineSurface = new Surface({
                size: [this.options.lineWidth, this.options.lineHeight],
                properties: {
                    backgroundColor: this.options.backgroundColor,
                    borderRadius: this.options.borderRadius+'px'
                }
            });

            var rotateModifier = new Modifier({
                transform: Transform.rotateZ(rotationOffset * i)
            });

            var spinLineModifier = new Modifier({
                opacity: _spinLineOpacity(i, 0, count),
                transform: Transform.translate(this.options.centerOffset, 0, 0)
            });

            this.spinLineModifiers.push(spinLineModifier);
            this.rotateModifiers.push(rotateModifier);
            this._add(rotateModifier).add(spinLineModifier).add(spinLineSurface);
        }
    }

    function _spinLineOpacity(i, t, count) {
        var pos = 1-((count-i+t)%count)/count;
        return pos*pos*0.9+0.1;
    }

    /**
     * Fade the spinner out then stop it
     *
     * @method fade
     *
     * @param {number} time in ms
     * @param {function} callback
     */

    Spinner.prototype.fade = function(t, cb) {
        if (arguments.length === 1) {
            cb = t;
            t = this.options.fadeDuration;
        }
        var count = this.rotateModifiers.length;
        var options = {
            duration: t,
            curve: this.options.fadeCurve
        };
        for (var i = 0; i < count; i++) {
            this.rotateModifiers[i].setOpacity(0, options, i === 0 ? this.stop.bind(this, cb) : null);
        }
    };

    /**
     * Spin the spinner for a set time
     *
     * @method spin
     *
     * @param {number} time in ms
     */

    Spinner.prototype.spin = function(t, cb) {
        this.start();
        Timer.setTimeout(this.stop.bind(this, cb), t);
    };

    /**
     * Start spinning...
     *
     * @method start
     */

    Spinner.prototype.start = function() {
        var count = this.spinLineModifiers.length;
        var t = 0;
        this.spinInterval = Timer.setInterval(function() {
            for (var i = 0; i < count; i++) {
                this.spinLineModifiers[i].setOpacity(_spinLineOpacity(i, t, count));
            }
            t++;
        }.bind(this), this.options.spinSpeed);
    };

    /**
     * Spin the spinner for a set time
     *
     * @method stop
     */

    Spinner.prototype.stop = function(cb) {
        if (this.spinInterval)
            Timer.clear(this.spinInterval);
        
        if (cb)
            cb();
    };

    /**
     * Reset the spinner
     *
     * @method reset
     */

    Spinner.prototype.reset = function(cb) {
        var count = this.spinLineModifiers.length;
        for (var i = 0; i < count; i++) {
            this.spinLineModifiers[i].setOpacity(_spinLineOpacity(i, 0, count));
            this.rotateModifiers[i].setOpacity(1);
        }
        this.stop(cb);
    };

    module.exports = Spinner;
});
