import { EventBus } from '../EventBus';
// import { Container } from 'phaser';

export const SCROLLTYPE = {
    WHEEL: 0,
    BAR: 1,
    SPHERE: 2
};

export const STATENUMS = {
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

    easySetup(enableInput = false) {
        this.hasSnap = false;
        this.direction = 0;
        this.minAlpha = this.minScale = 0.4;
        this.maxAlpha = this.maxScale = 1;
        this.damping = 250;
        this.hasInertia = true;
        this.inertiaMultiplier = [0.5, 0.5];
        this.inertiaDiminish = 200;
        this.deadZone = 8;

        if(enableInput)
            this.enableInput();
    }

    setPositions() { };
    toFront() { };

    /**
     * tweens the delta to place the closest item to the front
     */
    snapFrontHelper(deltaDist, obj) {
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

    insert(image, pos, isDelta) { };

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
            let ref = this.scene.add.contaier();
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
            console.warn("No reference to place at!");
            return;
        }
        item.x = item.reference.x; item.y = item.reference.y;
        item.delta = item.reference.delta;
        item.delta2 = item.reference.delta2;
        item.radius = item.reference.radius;
        item.alpha = item.reference.alpha;
        item.scale.x = item.reference.scale.x; item.scale.y = item.reference.scale.y;

        this.childArray.splice(this.childArray.indexOf(item.reference), 1, item);
        this.f_items.remove(item.reference, true);
        item.reference = null;

        this.f_items.add(item);
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

    setManualDistance(dist) { }

    manualUpdate(time, dt) {
        this.lastClick = null;
        let move = { val: this.manualDistance.val * dt, k: this.manualDistance.k, theta: this.manualDistance.theta * dt };
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

        return move;
    }

    dragUpdate(time, dt, p, move) {}

    update(time, dt) {
        this.removeDanglingReferences();
        // let dt = this.game.time.physicsElapsed * 60;
        let move = {val: 0, k: [0,0,1], theta: 0};
        let check = false;

        if (this.manualDistance !== null) {
            move = this.manualUpdate(time, dt);
            console.log('manualDistance move:', move);
            check = true;
        }

        if (this.initialClick && this.scene.input.activePointer.isDown) {
            if (!this.dragging && this.initialClick) {
                this.dragging = this.lastClick.distance(this.initialClick) > this.deadZone;
            }
            let p = new Phaser.Math.Vector2(this.scene.input.activePointer.x - this.lastClick.x,
                this.scene.input.activePointer.y - this.lastClick.y);

            move = this.dragUpdate(time, dt, p, move);
            check = true;
        }

        if (check) {
            if (this.moveSignal) this.moveSignal.dispatch(move);

            this.updateData(move);

            if (this.hasInertia) this.lastMove = move;
        }

        this.setPositions();
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

    updateData(move) { }

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
        this.scene.input.off('pointerup', this.childSelect, this);
        this.scene.input.off('pointerdown', this.onDown, this);
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
    radius2 = 30;
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