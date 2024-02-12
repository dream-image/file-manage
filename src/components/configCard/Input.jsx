import './style_input.css'

export default function Input({ children, ...props }) {
    return (
        <div style={{display:"flex",textAlign:"center",justifyContent:"space-evenly",alignItems:"center",}}>
            <div>{children}</div>
            <input type="number" min={props.min} max={props.max} autoComplete="off" name="text" className="input" defaultValue={props.value}></input>
            
        </div>

    )
}
