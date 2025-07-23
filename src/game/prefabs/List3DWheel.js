import { EventBus } from '../EventBus';
import { List3D, SCROLLTYPE, STATENUMS } from '../prefabs/List3D';
// import { Container } from 'phaser';

export class List3DWheel extends List3D {
    constructor(scene, x, y, children) {
        super(scene, x, y, children);
    }

    easySetup(enabledInput = false) {
        this.radius = 200;
        this.radius2 = 30;
        // Call the parent method to complete setup
        super.easySetup(enabledInput);
    }

    /**
     * Calculates the positions of the items for the WHEEL
     * based off of the deltas, radius and tilt
     * Called in the update function
     */
    setPositions() {
        for (let i = 0; i < this.childArray.length; ++i) {
            let dist = Math.sin(this.childArray[i].delta);
            let tilt = Math.cos(this.childArray[i].delta);
            this.childArray[i].zeta = tilt;

            this.childArray[i].alpha = (this.maxAlpha - this.minAlpha) * (tilt + 1) / 2 + this.minAlpha;
            this.childArray[i].scale = (this.maxScale - this.minScale) * (tilt + 1) / 2 + this.minScale;

            this.childArray[i].x = Math.cos(this.direction) * dist * this.radius + Math.cos(this.direction + Math.PI / 2) * tilt * this.radius2;
            this.childArray[i].y = Math.sin(this.direction) * dist * this.radius + Math.sin(this.direction + Math.PI / 2) * tilt * this.radius2;
        }
        this.f_items.sort('zeta');
        // if (this.childArray.length) {
        //     let i = 1;
        //     do {
        //         this.f_items.frontItem = this.f_items.getAt(this.f_items.length - i);
        //         i++;
        //     } while (this.f_items.frontItem && !this.f_items.frontItem.state === STATENUMS.ACTIVE);
        // }

    };

    /**
    * Called after input is finished
    * tweens the delta to place the closest item to the front
    */
    snapFront() {
        let deltaDist = 0, obj;
        let res = Math.min.apply(Math, this.childArray.map(i => {
            let d = Math.abs(i.delta);
            return i.state === STATENUMS.ACTIVE ? Math.min(Math.PI * 2 - d, d) : 10000;
        }));
        obj = this.childArray.find(i => {
            let d = Math.abs(i.delta);
            return Math.min(Math.PI * 2 - d, d) === res;
        });
        console.log('Snap front', obj, res);
        if (obj.delta > Math.PI)
            deltaDist = Math.PI * 2 - obj.delta;
        else if (obj.delta < -Math.PI)
            deltaDist = -(Math.PI * 2 + obj.delta);
        else
            deltaDist = -obj.delta;

        this.snapFrontHelper(deltaDist, obj);
    }

    toFront(item, speed) {
        let tempInput = this.inputIsEnabled;
        this.stopMovement();
        let deltaDist = -item.delta;

        this.f_items.forEach(i => {
            if (i.snapTween) {
                i.snapTween.stop();
                i.delta = i.dEnd;
            }
        }, this);

        if (item.delta > Math.PI)
            deltaDist = Math.PI * 2 - item.delta;
        else if (item.delta < -Math.PI)
            deltaDist = -(Math.PI * 2 + item.delta);

        item.temp = 0; let temp = 0;
        this.childArrayToFrontTween = this.game.add.tween(item).to({ temp: deltaDist }, speed, 'Linear', true);
        this.childArrayToFrontTween.onUpdateCallback(function () {
            this.f_items.forEach(i => {
                i.delta += (item.temp - temp);
                i.delta %= Math.PI * 2;
            }, this);
            temp = item.temp;
        }, this);

        if (tempInput)
            this.game.time.events.add(speed + 5, function () {
                this.enableInput();
            }, this);
    };

    insert(image, pos, isDelta) {
        let wrapper = this.scene.add.container(this.scene, 0, 0);
        wrapper.state = STATENUMS.ACTIVE;
        wrapper.add(image);
        this.f_items.add(wrapper);

        if (isDelta) {
            wrapper.delta = pos;
            wrapper.delta %= Math.PI * 2;
            //TODO: Push the new item into the correct spot, not just the end of array
            this.childArray.push(wrapper);
        }
        else {
            this.childArray.splice(pos, 0, wrapper);

            let max = this.childArray.length / 2;
            for (let i = 0; i < this.childArray.length; ++i) {
                this.childArray[i].delta = Math.PI * i / max;
                this.childArray[i].delta %= Math.PI * 2;
            }
        }
    };

    // Call last after setuping up all variables
    setupSprites(textures) {
        super.setupSprites(textures);
        let max = this.childArray.length / 2;

        for (let i = 0; i < this.childArray.length; ++i) {
            this.childArray[i].delta = Math.PI * i / max;
            this.childArray[i].delta %= Math.PI * 2;
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
            this.childArray[i].delta += (val / (this.damping / Math.PI) / max);
            this.childArray[i].delta %= Math.PI * 2;
        }

        //	this.wheelPositions();
    };

    dragUpdate(time, dt, p, move) {
        console.log('dragUpdate p:', p);
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