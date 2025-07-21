import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { List3D } from '../prefabs/List3D';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.cameras.main.setBackgroundColor(0x333333);

        this.f_wheel = new List3D(this, 569, 569, ['Blue', 'Red', 'Green', 'Yellow', 'Pink', 'Emerald', 'Orange']);
        this.f_wheel.easySetup(0);
        this.f_wheel.enableInput();

        let name = this.add.text(569, 384, 'GAME', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

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

    changeScene ()
    {
        this.scene.run('EM');
        this.scene.stop('UI');
        this.scene.stop();
    }
}
