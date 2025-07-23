import { EventBus } from '../EventBus';
import { List3D, SCROLLTYPE, STATENUMS } from '../prefabs/List3D';
// import { Container } from 'phaser';

export class List3DSphere extends List3D {
    constructor(scene, x, y, children) {
        super(scene, x, y, children);
    }

    easySetup(enabledInput = false) {
        this.radius = 250;
        this.radius2 = 3;
        // Call the parent method to complete setup
        super.easySetup(enabledInput);
    }

    /**
     * Calculates the positions of the items for the SPHERE
     * based off of the deltas and radius
     * Called in the update function
     */
    setPositions() {
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
    }

    insert(image, delta, phi, r) {
        let wrapper = this.scene.add.container(this.scene, 0, 0);
        wrapper.state = STATENUMS.ACTIVE;
        wrapper.add(image);
        this.f_items.add(wrapper);

        wrapper.radius = Util.clamp(r, 0, this.radius);
        wrapper.delta = delta;
        wrapper.delta2 = phi;
        wrapper.delta %= Math.PI * 2;
        wrapper.delta2 %= Math.PI * 2;

        wrapper.zeta = Math.cos(wrapper.delta);

        // this.f_items.add(wrapper);
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

    // Call last after setuping up all variables
    setupSprites(textures) {
        super.setupSprites(textures);
        let max = this.childArray.length / 2;

        //delata is in the range 0 to 2*PI in the xy-plane, \
        //and delta2 in the range 0 to PI.
        //delta is theta and delta2 is phi
        for (let i = 0; i < this.childArray.length; ++i) {
            this.childArray[i].delta = this.phiRand.rotation();//realInRange(-Math.PI * 2, Math.PI * 2);
            this.childArray[i].delta2 = this.thetaRand.rotation();//realInRange(-Math.PI * 2, Math.PI * 2);
            this.childArray[i].radius = this.radiusRand.realInRange(this.radius * 1 / 4, this.radius);
        }
    };

    setManualDistance(dist) {
        if (dist.k && dist.theta != null) {
            if (this.inertiaTween != null) {
                this.inertiaTween.stop();
                this.inertiaTween = null;
            }
            this.manualDistance = { val: 0, k: [0, 0, 1], theta: 0 };
            this.manualDistance.k = dist.k;
            this.manualDistance.theta = dist.theta;
        }
        else {
            console.warn("Not a proper Manual input");
        }
    }

    updateData(move) {
        if(move == null) return;
        let k = move.k || [0, 0, 1];
        let theta = move.theta || 0;

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

    dragUpdate(time, dt, p, move) {
        let currClick = [this.scene.input.activePointer.x - this.x, this.scene.input.activePointer.y - this.y];
        let lastClick = [this.lastClick.x - this.x, this.lastClick.y - this.y];

        currClick.push(this.getZ(currClick));
        lastClick.push(this.getZ(lastClick));

        let normCurr = this.normalize(currClick);
        let normLast = this.normalize(lastClick);

        // move.k = 
        move.k = this.normalize(this.crossProduct(normLast, normCurr));
        move.theta = Math.atan2(this.dotProduct(this.crossProduct(normLast, normCurr), move.k), this.dotProduct(normLast, normCurr));

        if (isNaN(move.theta)) {
            this.lastMove = null;
            this.manualDistance = null;
            return;
        }

        return move;
    }
}