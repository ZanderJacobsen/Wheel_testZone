import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { List3DWheel } from '../prefabs/List3DWheel';
import { List3DBar } from '../prefabs/List3DBar';
import { List3DSphere } from '../prefabs/List3DSphere';

export class Game extends Scene {

    f_wheel; f_bar; f_sphere;
    listsEnum;
    arrGlow = [['Red', 'Prompt'], ['Orange', 'Prompt'], ['Yellow', 'Prompt'],
    ['Green', 'Prompt'], ['Emerald', 'Prompt'], ['Blue', 'Prompt'], ['Pink', 'Prompt']];

    constructor() {
        super('Game');
    }

    create() {
        this.cameras.main.setBackgroundColor(0xffffff);

        this.setup3DLists();

        this.setupRegistry();
        this.setupRegistryEvents();

        EventBus.emit('current-scene-ready', this);
    }

    setup3DLists() {
        // Setup 3D lists if needed

        // Example for List3DSphere
        this.f_sphere = new List3DSphere(this, 569, 569);
        this.f_sphere.easySetup();
        this.f_sphere.setupSprites(structuredClone(this.arrGlow));
        this.f_sphere.scale = 0;

        // Example for List3DWheel
        this.f_wheel = new List3DWheel(this, 569, 569);
        this.f_wheel.easySetup(true);
        this.f_wheel.setupSprites(structuredClone(this.arrGlow));

        // Example for List3DBar
        this.f_bar = new List3DBar(this, 569, 569);
        this.f_bar.easySetup();
        this.f_bar.setupSprites(structuredClone(this.arrGlow));
        this.f_bar.scale = 0;

        this.currentList = this.f_wheel;
        this.listsEnum = {
            WHEEL: this.f_wheel,
            BAR: this.f_bar,
            SPHERE: this.f_sphere
        };
    }

    setupRegistry() {
        this.registry.set('hasSnap', false);
        this.registry.set('hasInertia', true);
        this.registry.set('direction', 0);
        this.registry.set('radius', 200);
        this.registry.set('radius2', 30);
        this.registry.set('type', 'WHEEL');
    }

    setupRegistryEvents() {
        this.registry.events.on('changedata', (parent, key, data) => {

            console.log('Registry changed:', key, data, this.currentList[key]);
            if (key === 'type') {
                this.currentList.disableInput();
                this.tweens.add({
                    targets: this.currentList,
                    scale: 0,
                    duration: 500,
                    ease: 'Back.easeIn',
                });
                this.currentList = this.listsEnum[data];
                this.tweens.add({
                    targets: this.currentList,
                    scale: 1,
                    duration: 500,
                    delay: 500,
                    ease: 'Back.easeOut',
                    onComplete: () => {
                        this.currentList.enableInput();
                    }
                });
            }
            else if(this.currentList[key] !== null) {
                let d = key == 'direction' ? Phaser.Math.DegToRad(data) : data;
                this.f_wheel[key] = d;
                this.f_bar[key] = d;
                this.f_sphere[key] = d;
            }
        });
    }

    // Work on game objects at each game step
    update(time, delta) {
        // Call the update method of List3D if it exists
        if (this.f_wheel) {
            this.f_wheel.update(time, delta);
        }
        if (this.f_bar) {
            this.f_bar.update(time, delta);
        }
        if (this.f_sphere) {
            this.f_sphere.update(time, delta);
        }
    }

    insertGem(key, index = 0, deltaFlag = false) {
        let s = this.add.image(0, 0, key);
        // Insert a gem into the wheel
        this.currentList.insert(s, index, deltaFlag);
    }

    changeScene() {
        this.scene.run('EM');
        this.scene.stop('UI');
        this.scene.stop();
    }
}
