
import "./style_config_card.css"

export default function ConfigCard({children,...props}) {


    return (
        <div className="card" style={{display:"flex",justifyContent:"flex-start",padding:"15px 5px 5px 5px",fontSize:"15px",flexDirection:"column",gap:"4px"}}>
            {children}
        </div>
    )
}
