import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class UI extends Scene
{
    logoTween;
    f_layer;

    constructor ()
    {
        super('UI');
        // this.isLoaded = false;
    }

    create ()
    {
        this.f_layer = this.add.image(569, 569, 'background').alpha = 0.25;

        let name = this.add.text(569, 460, 'UI', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setDepth(100).setOrigin(0.5);
        
        this.scene.run('Game');
        
        EventBus.emit('current-scene-ready', this);
    }

    // changeScene ()
    // {
    //     if (this.logoTween)
    //     {
    //         this.logoTween.stop();
    //         this.logoTween = null;
    //     }

    //     this.scene.start('EM');
    // }

    redirect (btn)
    {
        console.log('UI Redirect:', btn);
        let text = this.add.text(320, 25, 'REDIRECT', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setDepth(100).setOrigin(0.5);
        text.alpha = 0;

        this.tweens.add({
            targets: btn,
            scale: '-= 0.1',
            duration: 150,
            ease: 'Circ',
            yoyo: true,
        });

        this.tweens.add({
            targets: text,
            alpha: 1,
            duration: 150,
            ease: 'Linear',
            yoyo: true,
            hold: 1000,
            delay: 100,
            onComplete: () => {
                text.destroy();
            }
        });
    }

}
