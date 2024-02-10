import MonacoEditor from 'react-monaco-editor';
import React, { useEffect, useState, useRef } from 'react'
import * as monaco from 'monaco-editor'
import debounce from '../utils/debounce'
import { flushSync } from 'react-dom';
import { message } from 'antd';



export default function Content(props) {
    // console.log(props)
    const [text, setText] = useState("");
    let onChangeHandle = (value) => {
        setText(value);
        console.log(value)
    }
    let monacoDom = useRef(null)

    //监听视口变化
    const ob = new ResizeObserver(debounce((entries) => {
        if (instance)
            instance.layout()
    }, 100))
    function findFile(props) {

        return props.openedFileList[props.currentFocus.targetString]
    }
    //原生用法
    let instance
    useEffect(() => {
        // console.log()
        ob.observe(document.body)
        let leftBar = document.getElementById("leftBar")
        // console.log(leftBar)
        if (leftBar)
            ob.observe(leftBar)
        let topBar = document.getElementById("top-wrapper")
        if (topBar)
            ob.observe(topBar)

        let saveEvent = (event) => {

            if (event.ctrlKey && event.key === 's') {
                // console.log('count')
                event.preventDefault();
                let content = instance.getValue()
                try {
                    (async () => {
                        let writable = await props.currentFocus.currentHandle.createWritable();
                        // console.log(props.currentFocus.currentHandle)
                        await writable.write(content);
                        await writable.close()
                        props.store.dispatch({
                            type: "openedFile",
                            data: {
                                [props.currentFocus.targetString]: {
                                    ...file,
                                    hasChange: false,
                                    copyContext: content,
                                    originContext: content
                                }
                            }
                        })
                    })()
                } catch (error) {
                    console.log(error)
                    message.open({
                        type: 'error',
                        content: "保存失败，请刷新页面再试"
                    })
                }
            }
        }
        // 使用定时器延迟初始化
        let file
        const timer = setTimeout(() => {
            file = findFile(props)
            // console.log("更改file")
            // console.log(file)
            if (!file || !file.handle)
                return
            console.log(file.type)
            instance = monaco.editor.create(monacoDom.current, {
                value: file.copyContext,
                language: file.type
            });
            instance.onDidChangeModelContent(debounce(() => {
                let content = instance.getValue()
                if (file.originContext !== content) {
                    // console.log(props.currentFocus.targetString)
                    props.store.dispatch({
                        type: "openedFile",
                        data: {
                            [props.currentFocus.targetString]: {
                                ...file,
                                hasChange: true,
                                copyContext: content
                            }
                        }
                    })

                } else {
                    props.store.dispatch({
                        type: "openedFile",
                        data: {
                            [props.currentFocus.targetString]: {
                                ...file,
                                hasChange: false,
                                copyContext: content
                            }
                        }
                    })
                }

            }, 200));

            // console.log("触发绑定", file)
            monacoDom.current.addEventListener('keydown', saveEvent)
        }, 200); // 设置适当的延迟时间

        // 清除定时器
        return () => {
            clearTimeout(timer);
            if (instance) {
                instance.dispose();
            }
            ob.disconnect()
            // console.log("触发清除")
            monacoDom.current.removeEventListener('keydown', saveEvent)

        };
    }, [props.currentFocus]);

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
