import { EventBus } from '../EventBus';
// import { Container } from 'phaser';

export const SCROLLTYPE = {
    WHEEL: 0,
    BAR: 1,
    SPHERE: 2
};

const STATENUMS = {
    DEAD: 0,
    EMPTY: 1,
    ACTIVE: 2
};

export class List3D extends Phaser.GameObjects.Container {

    constructor(scene, x, y, children) {
        super(scene, x, y);
        this.scene = scene;
        this.x = x;
        this.y = y;

        this.f_items = this.scene.add.container(0, 0, []);
        // this.f_items._sortKey = 'zeta';
        this.add(this.f_items);
        if (children) {
            this.setupSprites(children);
        }

        this.scene.add.existing(this);
    }

    easySetup(type) {
        if (type == null)
            type = this.type;

        this.type = type;

        this.hasSnap = false;
        this.direction = 0;
        this.minAlpha = this.minScale = 0.4;
        this.maxAlpha = this.maxScale = 1;
        this.damping = 250;
        this.hasInertia = true;
        this.inertiaMultiplier = [2, 2];
        this.inertiaDiminish = 200;
        this.deadZone = 8;

        if (type == SCROLLTYPE.SPHERE) {
            this.radius = 250;
            this.radius2 = 3;
        }
        else {
            this.radius = 200;
            this.radius2 = type === SCROLLTYPE.WHEEL ? 30 : 200;
        }
        this.enableInput();
    }

    /**
     * Calculates the positions of the items for the WHEEL
     * based off of the deltas, radius and tilt
     * Called in the update function
     */
    wheelPositions() {
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
     * Calculates the positions of the items for the BAR
     * based off of the deltas, radius and threshold
     * Called in the update function
     */
    barPositions() {
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
    };

    /**
     * Calculates the positions of the items for the SPHERE
     * based off of the deltas and radius
     * Called in the update function
     */
    spherePositions() {
        let frontItem = this.f_items.frontItem;

        for (let i = 0; i < this.childArray.length; ++i) {
            let horizontalDist = Math.sin(this.childArray[i].delta) * Math.cos(this.childArray[i].delta2);
            let verticalDist = Math.sin(this.childArray[i].delta) * Math.sin(this.childArray[i].delta2);
            this.childArray[i].zeta = Math.cos(this.childArray[i].delta);

            let diameterDepth = (this.radius + this.childArray[i].radius * this.childArray[i].zeta) / (this.radius * 2);

            this.childArray[i].alpha = (this.maxAlpha - this.minAlpha) * diameterDepth + this.minAlpha;
            this.childArray[i].scale = (this.maxScale - this.minScale) * diameterDepth + this.minScale;

            this.childArray[i].x = horizontalDist * this.childArray[i].radius;
            this.childArray[i].y = verticalDist * this.childArray[i].radius;

            if (this.childArray[i].state === STATENUMS.ACTIVE && Math.abs(this.f_items.frontItem.delta % Math.PI * 2) > Math.abs(this.childArray[i].delta % Math.PI * 2))
                frontItem = this.childArray[i];
        }
        this.f_items.sort('scale');
        this.f_items.frontItem = frontItem;
    };


    /**
     * Called after input is finished
     * Does not work for SPHERE
     * tweens the delta to place the closest item to the front
     */
    snapFront() {
        if (this.type === SCROLLTYPE.SPHERE) return;

        let deltaDist = 0, obj;
        if (this.type === SCROLLTYPE.WHEEL) {
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
        }
        else if (this.type === SCROLLTYPE.BAR) {
            let res = Math.min.apply(Math, this.childArray.map(i => {
                return i.state === STATENUMS.ACTIVE ? Math.abs(i.delta) : 10000;
            }));
            obj = this.childArray.find(i => { return Math.abs(i.delta) === res; });
            deltaDist = -obj.delta;
        }
        // TODO: Tweens suck, maybe do it manually?
        this.f_items.iterate(i => {
            i.snapTween = this.scene.tweens.add({
                targets: i,
                delta: deltaDist + i.delta,
                duration: 100,
                ease: 'Linear',
            });
        }, this);
        if (this.haltSignal)
            this.game.time.events.add(102, function () {
                this.haltSignal.dispatch();
            }, this);
    };

    barToFront(item, speed) {
        if (this.barToFrontTween) {
            this.barToFrontTween.stop();
            this.barToFrontTween = null;
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

        this.barToFrontTween = item.snapTween;
    }

    wheelToFront(item, speed) {
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
        if (this.type === SCROLLTYPE.SPHERE)
            return;
        
        let wrapper = this.scene.add.container(this.scene, 0, 0);
        wrapper.state = STATENUMS.ACTIVE;
        wrapper.add(image);
        this.f_items.add(wrapper);

        if (isDelta) {
            console.log('Inserting with delta:', pos);
            wrapper.delta = pos;
            if (this.type == SCROLLTYPE.WHEEL)
                wrapper.delta %= Math.PI * 2;
            else {
                Util.clamp(wrapper.delta, -1, 1);
            }
            //TODO: Push the new item into the correct spot, not just the end of array
            this.childArray.push(wrapper);
        }
        else {
            this.childArray.splice(pos, 0, wrapper);

            let max = this.childArray.length / 2;
            if (this.type === SCROLLTYPE.WHEEL) {
                for (let i = 0; i < this.childArray.length; ++i) {
                    this.childArray[i].delta = Math.PI * i / max;
                    this.childArray[i].delta %= Math.PI * 2;
                }
            }
            else if (this.type === SCROLLTYPE.BAR) {
                for (let i = 0; i < this.childArray.length; ++i) {
                    this.childArray[i].delta = (i < max) ? i : i - this.childArray.length;
                    this.childArray[i].delta /= max;
                }
            }
        }
    };

    insertSphereSpherical(wrapper, delta, phi, r) {
        if (this.type !== SCROLLTYPE.SPHERE)
            return;

        wrapper.callAll('anchor.set', 'anchor', 0.5);

        wrapper.radius = Util.clamp(r, 0, this.radius);
        wrapper.delta = delta;
        wrapper.delta2 = phi;
        wrapper.delta %= Math.PI * 2;
        wrapper.delta2 %= Math.PI * 2;

        wrapper.zeta = Math.cos(wrapper.delta);

        this.f_items.add(wrapper);
        this.childArray.push(wrapper);

        //	this.f_items.sort('scale', Phaser.Group.SORT_ASCENDING);
    }

    // TODO: Make not trash
    insertSphereCartesian(wrapper, percentX, percentY, percentR, inback) {

        if (percentX > 1 || percentY > 1 || percentR > 1) {
            console.log('X, Y, or H is too big');
            console.log('X: ', percentX, 'Y: ', percentY, 'R: ', percentR);
            return false;
        }
        if (percentX < -1 || percentY < -1 || percentR <= 0) {
            console.log('X, Y, or H is too small');
            console.log('X: ', percentX, 'Y: ', percentY, 'R: ', percentR);
            return false;
        }

        wrapper.callAll('anchor.set', 'anchor', 0.5);

        let vec3 = [percentX * this.radius];//, percentY * this.radius];
        vec3.push(Math.sqrt(this.radius * this.radius - vec3[0] * vec3[0]) * percentY);
        wrapper.radius = this.radius * percentR;

        vec3.push(this.getZ(vec3));
        if (inback)
            vec3[2] *= -1;

        wrapper.delta = Math.acos(vec3[2] / Math.sqrt(vec3.reduce(function (acc, val) { return acc + val * val; }, 0)));
        wrapper.delta2 = Math.atan(vec3[1] / vec3[0]);
        wrapper.delta %= Math.PI * 2;
        wrapper.delta2 %= Math.PI * 2;

        if (vec3[0] < 0)
            wrapper.delta2 += Math.PI;

        this.f_items.add(wrapper);
        this.childArray.push(wrapper);
        return true;
    };

    getRefPos(group, item) {
        if (item.reference == null) {
            console.log("No reference to find!");
            return;
        }
        return this.posLocalToLocal(item.reference.parent, group, item.reference);
    };

    removeItem(destination, item, keep) {
        let pos = this.posLocalToLocal(item.parent, destination, item);
        let index = this.childArray.indexOf(item);
        if (keep) {
            let ref = this.game.add.group();
            ref.x = item.x; ref.y = item.y;
            ref.delta = item.delta;
            ref.delta2 = item.delta2;
            ref.radius = item.radius;
            ref.alpha = item.alpha;
            ref.scale.x = item.scale.x; ref.scale.y = item.scale.y;
            ref.state === STATENUMS.EMPTY;
            item.reference = ref;
            ref.original = item;

            this.childArray.splice(index, 1, ref);
            this.f_items.add(ref);
        }
        else
            this.childArray.splice(index, 1);

        destination.add(item);
        item.position.set(pos.x, pos.y);

        return item;
    };

    reInsert(item) {
        if (item.reference == null) {
            console.log("No reference to place at!");
            return;
        }
        item.x = item.reference.x; item.y = item.reference.y;
        item.delta = item.reference.delta;
        item.delta2 = item.reference.delta2;
        item.radius = item.reference.radius;
        item.alpha = item.reference.alpha;
        item.scale.x = item.reference.scale.x; item.scale.y = item.reference.scale.y;

        this.childArray.splice(this.childArray.indexOf(item.reference), 1);
        this.f_items.remove(item.reference, true);
        item.reference = null;

        this.f_items.add(item);
        this.childArray.push(item);
    };

    // Call last after setuping up all variables
    setupSprites(textures) {
        this.radiusRand = new Phaser.Math.RandomDataGenerator([this.radiusSeed]);
        this.thetaRand = new Phaser.Math.RandomDataGenerator([this.thetaSeed]);
        this.phiRand = new Phaser.Math.RandomDataGenerator([this.phiSeed]);

        if (textures && Array.isArray(textures)) {
            this.f_items.removeAll(true);
            this.childArray = [];

            while (textures.length > 0) {
                let s = textures.shift();
                let wrapper = this.scene.add.container(0, 0, []);
                wrapper.state = STATENUMS.ACTIVE;
                this.add(wrapper);
                
                if (typeof s === "string") {
                    s = this.scene.add.image(0, 0, s);
                    wrapper.add(s);
                    wrapper.key = s.key;
                } else if (Array.isArray(s)) {
                    while (s.length > 0) {
                        let t = this.scene.add.image(0, 0, s.pop());
                        wrapper.add(t);
                        t.alpha = 0;
                    }
                    wrapper.getAt(wrapper.length - 1).alpha = 1;
                    wrapper.key = wrapper.getAt(wrapper.length - 1).key;
                }
                else {
                    wrapper.add(s);
                    wrapper.key = s.key;
                }
                this.f_items.add(wrapper);
                this.childArray.push(wrapper);
            }
        }
        let max = this.childArray.length / 2;

        if (this.type === SCROLLTYPE.WHEEL) {
            for (let i = 0; i < this.childArray.length; ++i) {
                this.childArray[i].delta = Math.PI * i / max;
                this.childArray[i].delta %= Math.PI * 2;
            }
        }
        else if (this.type === SCROLLTYPE.BAR) {
            for (let i = 0; i < this.childArray.length; ++i) {
                this.childArray[i].delta = (i < max) ? i : i - this.childArray.length;
                this.childArray[i].delta /= max;
            }
        }
        else if (this.type === SCROLLTYPE.SPHERE) {
            //delata is in the range 0 to 2*PI in the xy-plane, \
            //and delta2 in the range 0 to PI.
            //delta is theta and delta2 is phi
            for (let i = 0; i < this.childArray.length; ++i) {
                this.childArray[i].delta = this.phiRand.rotation();//realInRange(-Math.PI * 2, Math.PI * 2);
                this.childArray[i].delta2 = this.thetaRand.rotation();//realInRange(-Math.PI * 2, Math.PI * 2);
                this.childArray[i].radius = this.radiusRand.realInRange(this.radius * 1 / 4, this.radius);
            }
        }
        this.f_items.frontItem = this.childArray[0];
    };

    setupCallback(callback) {
        this.callback = callback;
    };

    setupSignals() {
        this.moveSignal = new Phaser.Signal();
        this.haltSignal = new Phaser.Signal();
        this.idleSignal = new Phaser.Signal();
    };

    setupCircle(direction, radius, radius2) {
        if (direction != null) this.direction = direction;
        if (radius != null) this.radius = radius;
        if (radius2 != null) this.radius2 = radius2;
    };

    setupMinMax(minAlpha, minScale, maxAlpha, maxScale) {
        if (minAlpha) this.minAlpha = Math.max(minAlpha, 0);
        if (minScale) this.minScale = minScale;
        if (maxAlpha) this.maxAlpha = Math.min(maxAlpha, 1);
        if (maxScale) this.maxScale = maxScale;
    };

    setManualDistance(dist) {
        if (this.type !== SCROLLTYPE.SPHERE && dist.val != null) {
            if (this.inertiaTween != null) {
                this.inertiaTween.stop();
                this.inertiaTween = null;
            }
            this.manualDistance = { val: 0, k: [0, 0, 1], theta: 0 };
            this.manualDistance.val = dist.val;
        }
        else if (this.type === SCROLLTYPE.SPHERE && dist.k && dist.theta != null) {
            if (this.inertiaTween != null) {
                this.inertiaTween.stop();
                this.inertiaTween = null;
            }
            this.manualDistance = { val: 0, k: [0, 0, 1], theta: 0 };
            this.manualDistance.k = dist.k;
            this.manualDistance.theta = dist.theta;
        }
        else {
            console.log("Not a proper Manual input");
            return;
        }
    }

    update(time, dt) {
        this.removeDanglingReferences();
        // let dt = this.game.time.physicsElapsed * 60;
        

        if (this.scene.input.activePointer.isDown || this.manualDistance !== null) {
            let move = { val: 0, k: [0, 0, 1], theta: 0 };
            if (this.manualDistance !== null) {
                this.lastClick = null;
                move = { val: this.manualDistance.val * dt, k: this.manualDistance.k, theta: this.manualDistance.theta * dt };
                if (this.hasInertia && this.inertiaTween == null) {
                    console.log('Inertia started', this.manualDistance);
                    this.inertiaTween = this.scene.tweens.add({
                        targets: this.manualDistance,
                        val: 0,
                        theta: 0,
                        duration: this.inertiaDiminish,
                        ease: this.easeFunc,
                        onComplete: () => {
                            this.manualDistance = null;
                            this.lastMove = null;
                            this.dragging = false;
                            if (this.hasSnap) this.snapFront();
                            else if (this.haltSignal) this.haltSignal.dispatch();
                            this.inertiaTween = null;
                        }
                    });
                }
                else if (!this.hasInertia) {
                    this.manualDistance = null;
                }
            }
            else if (this.inputIsEnabled && this.initialClick) {
                if (!this.dragging && this.initialClick) {
                    this.dragging = this.lastClick.distance(this.initialClick) > this.deadZone;
                    //				if(this.dragging)
                    //					this.game.sound.play('Upgrade', 1, false);
                }
                let p = new Phaser.Math.Vector2(this.scene.input.activePointer.x - this.lastClick.x,
                    this.scene.input.activePointer.y - this.lastClick.y);
                if (this.type !== SCROLLTYPE.SPHERE) {
                    p = p.rotate(0, 0, -this.direction);

                    if (Math.abs(p.x) < 1) {
                        this.lastMove = null;
                        this.manualDistance = null;
                        return;
                    }
                    move.val = p.x;
                    this.lastClick = new Phaser.Math.Vector2(this.scene.input.activePointer.x, this.scene.input.activePointer.y);
                } else {
                    let currClick = [this.scene.input.activePointer.x - this.x, this.scene.input.activePointer.y - this.y];
                    let lastClick = [this.lastClick.x - this.x, this.lastClick.y - this.y];

                    currClick.push(this.getZ(currClick));
                    lastClick.push(this.getZ(lastClick));

                    let normCurr = this.normalize(currClick);
                    let normLast = this.normalize(lastClick);

                    move.k = this.normalize(this.crossProduct(normLast, normCurr));
                    move.theta = Math.atan2(this.dotProduct(this.crossProduct(normLast, normCurr), move.k), this.dotProduct(normLast, normCurr));

                    if (isNaN(move.theta)) {
                        this.lastMove = null;
                        this.manualDistance = null;
                        return;
                    }
                }
            } else return;


            if (this.moveSignal) this.moveSignal.dispatch(move);

            switch (this.type) {
                case SCROLLTYPE.WHEEL:
                    this.updateWheel(move.val);
                    break;
                case SCROLLTYPE.BAR:
                    this.updateBar(move.val);
                    break;
                case SCROLLTYPE.SPHERE:
                    this.updateSphere(move.k, move.theta);
                    break;
            }

            if (this.hasInertia) this.lastMove = move;
        }

        if (this.type === SCROLLTYPE.WHEEL) this.wheelPositions();
        else if (this.type === SCROLLTYPE.BAR) this.barPositions();
        else if (this.type === SCROLLTYPE.SPHERE) this.spherePositions();
    };

    removeDanglingReferences() {
        let toRemove = [];
        this.f_items.iterate(g => {
            if (g.state === STATENUMS.DEAD && (g.original == null)) {
                toRemove.push(g);
            }
        });
        toRemove.forEach(g => {
            this.f_items.remove(g, true);
        });
    };

    updateWheel(move) {
        let max = this.childArray.length / 2;

        for (let i = 0; i < this.childArray.length; ++i) {
            this.childArray[i].delta += (move / (this.damping / Math.PI) / max);
            this.childArray[i].delta %= Math.PI * 2;
        }

        //	this.wheelPositions();
    };

    updateBar(move) {
        let max = this.childArray.length / 2;

        for (let i = 0; i < this.childArray.length; ++i) {
            this.childArray[i].delta += (move / this.damping / max);
            if (this.childArray[i].delta >= 1 && move > 0) this.childArray[i].delta -= 2;
            else if (this.childArray[i].delta <= -1 && move < 0) this.childArray[i].delta += 2;
        }

        //	this.barPositions();
    };

    updateSphere(k, theta) {
        new Phaser.Math.Vector2(this.scene.input.activePointer.x, this.scene.input.activePointer.y);
        if (isNaN(theta)) //console.log("shit's broken yo");
            return;

        theta *= (180 + this.radius2 * 10) / 180;

        for (let i = 0; i < this.childArray.length; ++i) {
            let item = [this.childArray[i].x, this.childArray[i].y, this.childArray[i].zeta * this.childArray[i].radius];

            //		cosβa+sinβ(k^×a)+(k^⋅a)(1−cosβ)k^
            let a = item.map(x => { return x * Math.cos(theta); });
            let b = this.crossProduct(k, item).map(x => { return x * Math.sin(theta); });
            let c = k.map(x => { return x * this.dotProduct(k, item) * (1 - Math.cos(theta)); });
            let rotVector = [];
            for (let j = 0; j < 3; ++j)
                rotVector[j] = a[j] + b[j] + c[j];

            let delta = Math.acos(rotVector[2] / Math.sqrt(rotVector.reduce(function (acc, val) { return acc + val * val; }, 0)));
            let delta2 = Math.atan(rotVector[1] / rotVector[0]);

            if (rotVector[0] < 0)
                delta2 += Math.PI;


            if (!isNaN(delta) && !isNaN(delta2)) {
                this.childArray[i].delta = delta;
                this.childArray[i].delta2 = delta2;
            }
        }

        //	this.spherePositions();
    };

    stopMovement() {
        this.disableInput();
        this.lastMove = null;
        if (this.inertiaTween != null)
            this.inertiaTween.stop(true);
        this.manualDistance = null;
    };

    enableInput() {
        this.scene.input.on('pointerup', this.childSelect, this);
        this.scene.input.on('pointerdown', this.onDown, this);
        this.inputIsEnabled = true;
        return this;
    };

    disableInput() {
        this.game.input.onUp.remove(this.childSelect, this);
        this.game.input.onDown.remove(this.onDown, this);
        this.initialClick = null;
        this.inputIsEnabled = false;
        return this;
    };

    childSelect(pointer) {
        let onUp = this.initialClick ? true : false;

        this.initialClick = this.lastClick = undefined;
        if (this.dragging) {
            this.dragging = false;
            if (this.hasInertia && this.lastMove != null) {
                this.manualDistance = this.lastMove;
                this.manualDistance.theta *= this.inertiaMultiplier[0];
                this.manualDistance.val *= this.inertiaMultiplier[1];
                this.dragging = true;
            }
            else if (this.hasSnap) this.snapFront();
            else if (this.haltSignal) this.haltSignal.dispatch();
            return;
        }
        if (!onUp) return;

        let r = this.f_items.list.filter(item => {
            return item.getBounds().contains(pointer.x, pointer.y);
        });
        
        if (r.length > 1) {
            let res = Math.max.apply(Math, r.map(i => {
                return i.alpha !== 0 ? i.z : 0;
            }));
            let obj = r.find(i => { return i.z === res; });
            this.callback(obj);
        } else if (r.length === 1) {
            this.callback(r[0]);
        }
    };

    onDown(pointer) {
        console.log('onDown', pointer.x, pointer.y);
        const { tx, ty } = this.getWorldTransformMatrix();
        if (this.getBounds().contains(pointer.x, pointer.y) ||
            (this.type === SCROLLTYPE.SPHERE && Phaser.Math.Distance.Between(pointer.x, pointer.y, tx, ty) <= this.radius)) {
            this.initialClick = this.lastClick = new Phaser.Math.Vector2(pointer.x, pointer.y);
            this.lastMove = null;
            if (this.inertiaTween != null)
                this.inertiaTween.stop(true);
            this.manualDistance = null;

            if (this.idleSignal)
                this.idleSignal.dispatch();
        }
    };

    // Helper Functions
    dotProduct(vector1, vector2) {
        let result = 0;
        for (let i = 0; i < 3; i++) {
            result += vector1[i] * vector2[i];
        }
        return result;
    };

    crossProduct(vector1, vector2) {
        let result = [];
        result[0] = vector1[1] * vector2[2] - vector1[2] * vector2[1];
        result[1] = vector1[2] * vector2[0] - vector1[0] * vector2[2];
        result[2] = vector1[0] * vector2[1] - vector1[1] * vector2[0];
        return result;
    };

    normalize(vector) {
        let magnitude = 0; // POP POP
        vector.forEach(v => {
            magnitude += v * v;
        }, this);
        magnitude = Math.sqrt(magnitude);
        let result = [];
        vector.forEach(v => {
            result.push(v / magnitude);
        }, this);
        return result;
    };

    getZ(arr) {
        let dist = Math.sqrt(arr[0] * arr[0] + arr[1] * arr[1]);
        let z = Math.sqrt(this.radius * this.radius * this.radius2 - dist * dist);
        if (isNaN(z)) {
            z = 0;
            //		console.log(dist, z);
        }
        return z;
    };

    posWorldToLocal(group, worldPoint) {
        return group.worldTransform.applyInverse(worldPoint, new Phaser.Math.Vector2());
    };

    posLocalToWorld(group, localPoint) {
        return group.worldTransform.apply(localPoint, new Phaser.Math.Vector2());
    };

    posLocalToLocal(groupFrom, groupTo, localPoint) {
        return this.posWorldToLocal(groupTo, this.posLocalToWorld(groupFrom, localPoint));
    };

    f_items = null; // Container for the items
    // Array for easier rotating math
    childArray = [];
    // Determines which version of wheel
    type = SCROLLTYPE.WHEEL; // WHEEL, BAR, SPHERE
    // Whether you want the closest item to snap to front or not
    // Works only for WHEEL and BAR
    hasSnap = true;
    // Direction in which the WHEEL or BAR will spin in radians
    direction = 0; //Math.PI/2;
    // Attributes that depict depth/distance
    minAlpha = 0.4; minScale = 0.4;
    maxAlpha = 1; maxScale = 1;
    // Radius in pixels
    radius = 200;
    // Radius value: tilt for WHEEL, threshold for BAR in pixels, and 
    // calculation multiplier for SPHERE 
    // Ranges for radius2 are as follows:
    // WHEEL [-150, 150]    BAR [0, radius]	    SPHERE [1, INF]
    radius2 = 300;
    // Whether the user is currently dragging or not
    // Used to stop any unwanted selection
    dragging = false;
    // Used to hold the initial and latest click values
    initialClick;
    lastClick;
    // Callback function for the selected item 
    callback = (wrapper) => console.log(wrapper.getAt(wrapper.length - 1).texture.key);
    // Sets if the input is currently enabled
    inputIsEnabled = false;
    // Use to manually rotate the wheel
    // Structure should be as follows: {val: ??, k: [??,??,??], theta: ??};
    manualDistance = null;
    // Used to damp the speed for WHEEL and BAR
    damping = 250;
    // Determines if the wheel stops or slows down after input is done
    hasInertia = true;
    // Determines the diminishing and starting values
    inertiaMultiplier = [2, 0.5];
    inertiaDiminish = 200;
    // Sets the inertiaTween and Snap Easing Function
    easeFunc = 'Cubic';
    // The last amount moved
    lastMove = null;//{val: 0, k: [0,0,1], theta: 0};
    // Deadzone determines the jitter in pixels allowed for clicks to still register
    deadZone = 8;
    // Signals for when the wheel is moving and when its done moving
    // Call setupSignals to set these up
    moveSignal = null;
    haltSignal = null;
    idleSignal = null;

    // Seed to determine where initial SPHERE positions are
    radiusSeed = '1234';
    thetaSeed = '690';
    phiSeed = '4200';

    delta = 0;
    delta2 = 0;
}