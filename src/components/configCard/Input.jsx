import './style_input.css'
import store from '../../store'
export default function Input({ children, ...props }) {
    return (
        <div style={{display:"flex",textAlign:"center",justifyContent:"space-evenly",alignItems:"center",}}>
            <div>{children}</div>
            <input type="number" min={props.min} max={props.max} autoComplete="off" name="text" className="input" value={props.value} onChange={(e)=>{
                store.dispatch({
                    type:"config",
                    config:{[props.name]:e.target.value}
                })
            }}></input>
            
        </div>

    )
}
