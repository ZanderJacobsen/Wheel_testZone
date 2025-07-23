import { EventBus } from '../EventBus';
import { List3D, SCROLLTYPE, STATENUMS } from '../prefabs/List3D';
// import { Container } from 'phaser';

export class List3DBar extends List3D {
    constructor(scene, x, y, children) {
        super(scene, x, y, children);
    }

    easySetup(enabledInput) {
        this.radius = 200;
        this.radius2 = 200;
        // Call the parent method to complete setup
        super.easySetup(enabledInput);
    }

    /**
     * Calculates the positions of the items for the BAR
     * based off of the deltas, radius and threshold
     * Called in the update function
     */
    setPositions() {
        for (let i = 0; i < this.childArray.length; ++i) {
            let distance = Phaser.Math.Distance.Between(this.childArray[i].x, this.childArray[i].y, 0, 0)

            if (this.radius2 && distance > this.radius2)
                this.childArray[i].alpha = 0;
            else
                this.childArray[i].alpha = this.maxAlpha - Math.abs(this.childArray[i].delta) * (this.maxAlpha - this.minAlpha);
            this.childArray[i].scale = this.maxScale - Math.abs(this.childArray[i].delta) * (this.maxScale - this.minScale);
            this.childArray[i].zeta = -Math.abs(this.childArray[i].delta);

            this.childArray[i].x = Math.cos(this.direction) * this.childArray[i].delta * this.radius;
            this.childArray[i].y = Math.sin(this.direction) * this.childArray[i].delta * this.radius;
        }
        this.f_items.sort('zeta');
        // if (this.childArray.length) {
        //     i = 1;
        //     do {
        //         this.f_items.frontItem = this.f_items.getAt(this.f_items.length - i);
        //         i++;
        //     } while (this.f_items.frontItem && !this.f_items.frontItem.state === STATENUMS.ACTIVE);
        // }
    }

    /**
    * Called after input is finished
    * tweens the delta to place the closest item to the front
    */
    snapFront() {
        let deltaDist = 0, obj;
        let res = Math.min.apply(Math, this.childArray.map(i => {
            return i.state === STATENUMS.ACTIVE ? Math.abs(i.delta) : 10000;
        }));
        obj = this.childArray.find(i => { return Math.abs(i.delta) === res; });
        deltaDist = -obj.delta;

        this.snapFrontHelper(deltaDist, obj);
    }

    toFront(item, speed) {
        if (this.toFrontTween) {
            this.toFrontTween.stop();
            this.toFrontTween = null;
        }
        let tempInput = this.inputIsEnabled;
        this.stopMovement();
        let deltaDist = -item.delta;

        item.temp = 0; let temp = 0;
        item.snapTween = this.game.add.tween(item).to({ temp: 1 }, speed, 'Back', true, 0);
        item.snapTween.onUpdateCallback(function () {
            this.f_items.forEach(i => {
                i.delta += (item.temp - temp) * deltaDist;
                if (i.delta >= 1) i.delta -= 2;
                else if (i.delta <= -1) i.delta += 2;
            }, this);
            temp = item.temp;
        }, this);
        item.snapTween.onComplete.add(function () {
            this.f_items.forEach(i => {
                i.delta += (item.temp - temp) * deltaDist;
                if (i.delta >= 1) i.delta -= 2;
                else if (i.delta <= -1) i.delta += 2;
            }, this);
            temp = item.temp;
        }, this);

        if (tempInput)
            this.game.time.events.add(speed + 50, function () {
                this.enableInput();
            }, this);

        this.toFrontTween = item.snapTween;
    }

    insert(image, pos, isDelta) {
        let wrapper = this.scene.add.container(this.scene, 0, 0);
        wrapper.state = STATENUMS.ACTIVE;
        wrapper.add(image);
        this.f_items.add(wrapper);

        if (isDelta) {
            wrapper.delta = pos;
            Util.clamp(wrapper.delta, -1, 1);
            //TODO: Push the new item into the correct spot, not just the end of array
            this.childArray.push(wrapper);
        }
        else {
            this.childArray.splice(pos, 0, wrapper);

            let max = this.childArray.length / 2;
            for (let i = 0; i < this.childArray.length; ++i) {
                this.childArray[i].delta = (i < max) ? i : i - this.childArray.length;
                this.childArray[i].delta /= max;
            }
        }
    };

    // Call last after setuping up all variables
    setupSprites(textures) {
        super.setupSprites(textures);
        let max = this.childArray.length / 2;

        for (let i = 0; i < this.childArray.length; ++i) {
            this.childArray[i].delta = (i < max) ? i : i - this.childArray.length;
            this.childArray[i].delta /= max;
        }
    };

    setManualDistance(dist) {
        if (dist.val != null) {
            if (this.inertiaTween != null) {
                this.inertiaTween.stop();
                this.inertiaTween = null;
            }
            this.manualDistance = { val: 0, k: [0, 0, 1], theta: 0 };
            this.manualDistance.val = dist.val;
        }
        else {
            console.warn("Not a proper Manual input");
        }
    }

    updateData(move) {
        if(move == null) return;
        let val = move.val;
        let max = this.childArray.length / 2;

        for (let i = 0; i < this.childArray.length; ++i) {
            this.childArray[i].delta += (val / this.damping / max);
            if (this.childArray[i].delta >= 1 && val > 0) this.childArray[i].delta -= 2;
            else if (this.childArray[i].delta <= -1 && val < 0) this.childArray[i].delta += 2;
        }

        //	this.barPositions();
    };

    dragUpdate(time, dt, p, move) {
        p = p.rotate(-this.direction);

        if (Math.abs(p.x) < 1) {
            this.lastMove = null;
            this.manualDistance = null;
            return;
        }
        move.val = p.x;
        this.lastClick = new Phaser.Math.Vector2(this.scene.input.activePointer.x, this.scene.input.activePointer.y);

        return move;
    }
}