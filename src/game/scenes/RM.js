import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class RM extends Scene
{
    f_layer;
    f_logo; f_btn; f_cta; f_ctaText;

    constructor ()
    {
        super('RM');
    }

    create ()
    {
        this.cameras.main.setBackgroundColor(0x330000);

        this.f_layer = this.add.image(320, 569, 'background');

        let name = this.add.text(320, 384, 'RM', {
            fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);

        this.f_logo = this.add.image(320, 269, 'logo').setDepth(100);
        this.f_btn = this.add.image(0, 0, 'debugBtn');
        this.f_ctaText = this.add.text(0, 0, 'DOWNLOAD', {
            fontFamily: 'Arial Black', fontSize: 20, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5).setDepth(100);
        
        this.f_cta = this.add.container(320, 869, [this.f_btn, this.f_ctaText]);
        
        this.f_cta.setInteractive(this.f_btn.getBounds().setPosition(-this.f_btn.width/2, -this.f_btn.height/2), Phaser.Geom.Rectangle.Contains);
        this.f_logo.setInteractive();
        this.f_cta.on('pointerdown', () => this.redirect(this.f_cta));
        this.f_logo.on('pointerdown', () => this.redirect());

        EventBus.emit('current-scene-ready', this);
    }

    redirect (btn)
    {
        console.log('RM Redirect:', btn);
        let text = this.add.text(320, 25, 'REDIRECT', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setDepth(100).setOrigin(0.5);
        text.alpha = 0;

        if(btn) {
            this.tweens.add({
                targets: btn,
                scale: '-= 0.1',
                // y: '-= 0.1',
                duration: 150,
                ease: 'Circ',
                yoyo: true,
            });
        }

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

    changeScene ()
    {
        this.scene.start('UI');
    }
}
