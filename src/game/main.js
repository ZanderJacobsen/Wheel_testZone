import { Boot } from './scenes/Boot';
import { Game } from './scenes/Game';
import { EM } from './scenes/EM';
import { RM } from './scenes/RM';
import { UI } from './scenes/UI';
import Phaser from 'phaser';
import { Preloader } from './scenes/Preloader';

// Find out more information about the Game Config at:
// https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config = {
    type: Phaser.AUTO,
    width: 640,
    height: 1138,
    parent: 'game-container',
    backgroundColor: '#028af8',
    scene: [
        Boot,
        Preloader,
        Game,
        UI,
        EM,
        RM
    ]
};

const StartGame = (parent) => {

    return new Phaser.Game({ ...config, parent });

}

export default StartGame;
