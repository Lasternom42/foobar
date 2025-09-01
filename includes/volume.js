'use strict';

function _volumebar(x, y, w, h) {
	this.volume_change = () => {
		window.RepaintRect(this.x, this.y, this.w, this.h);
	}
	
	this.trace = (x, y) => {
		const m = this.drag ? 200 : 0;
		return x > this.x - m && x < this.x + this.w + (m * 2) && y > this.y - m && y < this.y + this.h + (m * 2);
	}
	
	this.wheel = (s) => {
		if (this.trace(this.mx, this.my)) {
			if (s > 0) {
				fb.VolumeUp();
			} else {
				fb.VolumeDown();
			}
			_tt('');
			return true;
		} else {
			return false;
		}
	}
	
	this.move = (x, y) => {
		this.mx = x;
		this.my = y;
		if (this.trace(x, y)) {
			x -= this.x;
			const pos = x < 0 ? 0 : x > this.w ? 1 : x / this.w;
			// Convert position to dB value (-100 to 0)
			this.drag_vol = pos === 0 ? -100 : (20 * Math.log10(pos));
			
			// Clamp volume to valid range
			this.drag_vol = Math.max(-100, Math.min(0, this.drag_vol));
			
			_tt(this.drag_vol.toFixed(1) + ' dB');
			if (this.drag) {
				fb.Volume = this.drag_vol;
				this.volume_change();
			}
			this.hover = true;
			return true;
		} else {
			if (this.hover) {
				_tt('');
			}
			this.hover = false;
			this.drag = false;
			return false;
		}
	}
	
	this.lbtn_down = (x, y) => {
		if (this.trace(x, y)) {
			this.drag = true;
			return true;
		} else {
			return false;
		}
	}
	
	this.lbtn_up = (x, y) => {
		if (this.trace(x, y)) {
			if (this.drag) {
				this.drag = false;
				fb.Volume = this.drag_vol;
			}
			return true;
		} else {
			this.drag = false;
			return false;
		}
	}
	
	this.pos = () => {
		// Convert dB to linear position (0 to width)
		const currentVol = fb.Volume;
		if (currentVol <= -100) {
			return 0;
		}
		// Convert from dB to linear scale (0-1)
		const linearPos = Math.pow(10, currentVol / 20);
		return Math.ceil(this.w * linearPos);
	}
	
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	this.mx = 0;
	this.my = 0;
	this.hover = false;
	this.drag = false;
	this.drag_vol = 0;
}