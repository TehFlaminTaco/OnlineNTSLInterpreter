ntslWS = new WebSocket("ws://" + location.hostname + ":4132", "ntsl-interpreter")
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
            fillTerminal(data.body)
    }
}

window.commandLineEntry = function(event){
    if(event.key == "Enter"){
        var cmline = this.document.getElementById("commandline")
        ntslWS.send(JSON.stringify({
            action: "topic",
            topic: "cmd?" + cmline.value
        }));
        cmline.value = "";
        cmline.select();
    }
}

window.fillTerminal = function(text){
    this.document.getElementById("terminal").innerHTML = text;
    $("#terminal a").each((id,ele)=>{
         var topic = this.decodeURIComponent(ele.href.match("PRG_topic=([^$]*)")[1]);
         ele.href = "#";
         ele.onclick = ()=>{
            var sentTopic = topic;
            if(topic[0] && topic[0] == "?"){
                sentTopic = topic.substr(1)+"?"+prompt();
            }
            ntslWS.send(JSON.stringify({
                action: "topic",
                topic: sentTopic
            }));
         }
    });

}

window.run_ntsl = function(){
    ntslWS.send(JSON.stringify({
        action: "execute",
        code: editor.getValue()
    }));
    fillTerminal("<font color=green>Loading...</font>")
}

window.addEventListener("load", ()=>{
    window.editor = ace.edit("ntsleditor")
    editor.setTheme("ace/theme/cobalt")
    editor.session.setMode("ace/mode/ntsl")
})