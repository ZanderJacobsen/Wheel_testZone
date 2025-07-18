import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class EM extends Scene
{
    constructor ()
    {
        super('EM');
    }

    create ()
    {
        this.cameras.main.setBackgroundColor(0xff0000);

        this.add.image(320, 569, 'background').setAlpha(0.5);

        this.add.text(320, 384, 'EM', {
            fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        EventBus.emit('current-scene-ready', this);
    }

    changeScene ()
    {
        this.scene.start('RM');
    }
}
