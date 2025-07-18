import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.cameras.main.setBackgroundColor(0x333333);

        // this.add.image(512, 384, 'background').setAlpha(0.5);

        let name = this.add.text(320, 384, 'GAME', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        EventBus.emit('current-scene-ready', this);
    }

    // Work on game objects at each game step
    update(time, delta) 
    {

    }

    changeScene ()
    {
        this.scene.run('EM');
        this.scene.stop('UI');
        this.scene.stop();
    }
}
