import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { List3D, SCROLLTYPE } from '../prefabs/List3D';

export class Game extends Scene
{

    f_wheel;
    arrGlow = [['Red', 'Prompt'], ['Orange', 'Prompt'], ['Yellow', 'Prompt'],
	 ['Green', 'Prompt'], ['Emerald', 'Prompt'], ['Blue', 'Prompt'], ['Pink', 'Prompt']];

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.cameras.main.setBackgroundColor(0x333333);

        this.f_wheel = new List3D(this, 569, 569);
        this.f_wheel.easySetup(0);
        this.f_wheel.setupSprites(this.arrGlow);
        // this.f_wheel.setupCircle(60, 300, 90)
        this.registry.set('snap', false);
        this.registry.set('inertia', true);
        this.registry.set('type', 'WHEEL');

        this.registry.events.on('changedata', (parent, key, data) => {
            if (key === 'snap') {
                this.f_wheel.hasSnap = data;
            }
            if (key === 'inertia') {
                this.f_wheel.hasInertia = data;
            }
            if (key === 'type') {
                this.f_wheel.type = SCROLLTYPE[data];
                console.log('Scroll Type:', data);
            }
        });

        // let name = this.add.text(569, 384, 'GAME', {
        //     fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
        //     stroke: '#000000', strokeThickness: 8,
        //     align: 'center'
        // }).setOrigin(0.5).setDepth(100);

        EventBus.emit('current-scene-ready', this);
    }

    // Work on game objects at each game step
    update(time, delta) 
    {
        // Call the update method of List3D if it exists
        if (this.f_wheel) {
            this.f_wheel.update(time, delta);
        }
    }
    
    insertGem (key, index = 0, deltaFlag = false)
    {
        let s = this.add.image(0, 0, key);
        // Insert a gem into the wheel
        this.f_wheel.insert(s, index, deltaFlag);
    }

    changeScene ()
    {
        this.scene.run('EM');
        this.scene.stop('UI');
        this.scene.stop();
    }
}
