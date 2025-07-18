import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class UI extends Scene
{
    logoTween;
    f_DL; f_icon;
    f_layer;

    constructor ()
    {
        super('UI');
        // this.isLoaded = false;
    }

    create ()
    {
        this.f_layer = this.add.image(320, 569, 'background').alpha = 0.25;

        this.f_icon = this.add.image(65, 65, 'debugBtn').setDepth(100);
        this.f_DL = this.add.image(565, 1073, 'debugBtn').setDepth(100);
        // console.log(this.f_DL)

        let name = this.add.text(320, 460, 'UI', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setDepth(100).setOrigin(0.5);
        
        this.scene.run('Game');
        
        this.f_icon.setInteractive();
        this.f_DL.setInteractive();
        this.f_DL.on('pointerdown', () => this.redirect(this.f_DL));
        this.f_icon.on('pointerdown', () => this.redirect(this.f_icon));
        
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

    moveLogo (reactCallback)
    {
        if (this.logoTween)
        {
            if (this.logoTween.isPlaying())
            {
                this.logoTween.pause();
            }
            else
            {
                this.logoTween.play();
            }
        }
        else
        {
            this.logoTween = this.tweens.add({
                targets: this.logo,
                x: { value: 750, duration: 3000, ease: 'Back.easeInOut' },
                y: { value: 80, duration: 1500, ease: 'Sine.easeOut' },
                yoyo: true,
                repeat: -1,
                onUpdate: () => {
                    if (reactCallback)
                    {
                        reactCallback({
                            x: Math.floor(this.logo.x),
                            y: Math.floor(this.logo.y)
                        });
                    }
                }
            });
        }
    }

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
            // y: '-= 0.1',
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
