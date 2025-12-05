import Window from '../blocks/window'
import Mailline from '../blocks/mailLine'


function Mail() {
    

    return (
        <Window title="Mail" initialPosition={{ x: 200, y: 200 }} initialSize={{ width: 300, height: 200 }}>
            <div className="w-full h-full">
                <Mailline/>
            </div>
        </Window>
    )
}

export default Mail