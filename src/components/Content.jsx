import MonacoEditor from 'react-monaco-editor';
import React, { useEffect, useState, useRef } from 'react'
import * as monaco from 'monaco-editor'
import debounce from '../utils/debounce'


export default function Content(props) {
    const [text, setText] = useState("");
    let onChangeHandle = (value) => {
        setText(value);
        console.log(value)
    }
    let monacoDom = useRef(null)
    //原生用法
    let instance
    useEffect(() => {
        // 使用定时器延迟初始化
        const timer = setTimeout(() => {
            instance = monaco.editor.create(monacoDom.current, {
                value: `这是测试
console.log("Hello, world")
`,
                language: 'javascript'
            });
            instance.onDidChangeModelContent(debounce(() => {
                console.log(instance.getValue());
            }));
        }, 400); // 设置适当的延迟时间

        // 清除定时器
        return () => {
            clearTimeout(timer);
            if (instance) {
                instance.dispose();
            }
        };
    }, []);

    return (
        <div id="monaco" style={{ height: "100%", width: "100%" }} ref={monacoDom}>
            {/* reactMonaco用法 */}
            {/* <MonacoEditor
                width="100%"
                height="100%"
                language="javascript"
                theme="vs-light"
                value={text}
                onChange={onChangeHandle}
                options={{
                    selectOnLineNumbers: true,
                    matchBrackets: "near",
                }}
            /> */}

        </div>
    )
}