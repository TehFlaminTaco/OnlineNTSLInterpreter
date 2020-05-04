ntslWS = new WebSocket("ws://" + location.hostname + ":80", "ntsl-interpreter")
ntslWS.onmessage = function(event){
    var data;
    try{
        data = JSON.parse(event.data)
    }catch(e){
        console.error(e);
        return console.error("Something went wrong whilst parsing message.")
    }

    switch(data.action){
        case "update_terminal":
            document.getElementById("terminal").innerHTML = data.body;
    }
}

window.run_ntsl = function(){
    ntslWS.send(JSON.stringify({
        action: "execute",
        code: editor.getValue()
    }));
}

window.addEventListener("load", ()=>{
    window.editor = ace.edit("ntsleditor")
    editor.setTheme("ace/theme/cobalt")
    editor.session.setMode("ace/mode/ntsl")
})