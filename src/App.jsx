import { useRef, useState } from 'react';

import Phaser from 'phaser';
import { PhaserGame } from './game/PhaserGame';

function App() {
    // The sprite can only be moved in the MainMenu Scene
    const [canMoveSprite, setCanMoveSprite] = useState(true);

    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef();
    const [spritePosition, setSpritePosition] = useState({ x: 0, y: 0 });

    const [scrollType, setScrollType] = useState('WHEEL');

    const [gemFlag, setGemFlag] = useState(false);
    const [gemValue, setGemValue] = useState(0);
    const [selectedGem, setSelectedGem] = useState('Red');
    const gemOptions = ['Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Orange', 'Emerald'];

    const [snapFlag, setSnapFlag] = useState(false);
    const [inertFlag, setInertFlag] = useState(true);

    const [slider1, setSlider1] = useState(0);
    const [slider2, setSlider2] = useState(200);
    const [slider3, setSlider3] = useState(30);

    const changeScene = () => {

        const scene = phaserRef.current.scene;

        if (scene) {
            scene.changeScene();
        }
    }

    const moveSprite = () => {

        const scene = phaserRef.current.scene;

        if (scene && scene.scene.key === 'MainMenu') {
            // Get the update logo position
            scene.moveLogo(({ x, y }) => {

                setSpritePosition({ x, y });

            });
        }
    }

    const addSprite = () => {

        const scene = phaserRef.current.scene;

        if (scene && scene.scene.key === 'Game') {
            scene.insertGem(selectedGem, gemValue, gemValue);
        }
    }

    const editRegistry = (str, val) => {

        const scene = phaserRef.current.scene;
        // Update the registry value
        phaserRef.current.game.registry.set(str, val)
        // console.log('editRegistry:', str, val);
    }

    // Event emitted from the PhaserGame component
    const currentScene = (scene) => {

        setCanMoveSprite(scene.scene.key !== 'MainMenu');

    }



    <div>

    </div>

    return (
        <div id="app">
            <PhaserGame ref={phaserRef} currentActiveScene={currentScene} />
            <div>
                <div>
                    <button className="button" onClick={changeScene}>Change Scene</button>
                </div>
                <div>
                    <label>
                        <input
                            type="radio" name="scrollType" value="WHEEL" checked={scrollType === 'WHEEL'}
                            onChange={e => { setScrollType(e.target.value); editRegistry('type', e.target.value); }}
                        />
                        WHEEL
                    </label>
                    <label>
                        <input
                            type="radio" name="scrollType" value="BAR" checked={scrollType === 'BAR'}
                            onChange={e => { setScrollType(e.target.value); editRegistry('type', e.target.value); }}
                        />
                        BAR
                    </label>
                    <label>
                        <input
                            type="radio" name="scrollType" value="SPHERE" checked={scrollType === 'SPHERE'}
                            onChange={e => { setScrollType(e.target.value); editRegistry('type', e.target.value); }}
                        />
                        SPHERE
                    </label>
                </div>
                {/* <div>
                    <button disabled={canMoveSprite} className="button" onClick={moveSprite}>Toggle Movement</button>
                </div>
                <div className="spritePosition">Sprite Position:
                    <pre>{`{\n  x: ${spritePosition.x}\n  y: ${spritePosition.y}\n}`}</pre>
                </div> */}
                <div>
                    <label> Snap On:
                        <input type="checkbox" checked={snapFlag}
                            onChange={e => { setSnapFlag(e.target.checked); editRegistry('snap', e.target.checked); }}
                        />
                    </label>
                    <label> Inertia On:
                        <input type="checkbox" checked={inertFlag}
                            onChange={e => { setInertFlag(e.target.checked); editRegistry('inertia', e.target.checked); }}
                        />
                    </label>
                </div>
                <div>
                    <select value={selectedGem} onChange={e => setSelectedGem(e.target.value)}>
                        {gemOptions.map(gem => (
                            <option key={gem} value={gem}>{gem}</option>
                        ))}
                    </select>
                    <label> Index:
                        <input type="number" step="any" value={gemValue}
                            onChange={e => setGemValue(Number(e.target.value))}
                            style={{ width: '30px' }}
                        />
                    </label>
                    <label> Delta Flag:
                        <input type="checkbox" checked={gemFlag}
                            onChange={e => setGemFlag(e.target.checked)}
                        />
                    </label>
                </div>
                <div>
                    <button className="button" onClick={addSprite}>Add Gem</button>
                </div>
                <div>
                    <label>
                        Direction:
                        <input
                            type="range" min="0" max="360" value={slider1}
                            onChange={e => {setSlider1(Number(e.target.value)); editRegistry('direction', e.target.value); }}
                        />
                        {slider1}
                    </label>
                </div>
                <div>
                    <label>
                        Radius:
                        <input
                            type="range" min="50" max="500" value={slider2}
                            onChange={e => {setSlider2(Number(e.target.value)); editRegistry('radius', e.target.value); }}
                        />
                        {slider2}
                    </label>
                </div>
                <div>
                    <label>
                        Tilt/Threshold:
                        <input
                            type="range" min="-180" max="180" value={slider3}
                            onChange={e => {setSlider3(Number(e.target.value)); editRegistry('radius2', e.target.value); }}
                        />
                        {slider3}
                    </label>
                </div>
            </div>
        </div>
    )
}

export default App
