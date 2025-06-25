import yaml from "yaml";
import fs from "node:fs/promises";

async function loadYamlLossingData(path) {
  const file = await fs.readFile(path, "utf8");
  return yaml.parse(file);
}
async function loadYamlFile(path) {
  const file = await fs.readFile(path, "utf8");
  return yaml.parseDocument(file);
}
async function outputYamlFile(path, data) {
  const file = String(data);
  await fs.writeFile(path, file);
}

async function main() {
    const source = await loadYamlLossingData("./source.yaml");
    const dest = await loadYamlFile("./asyncapi.yaml");

    if(!dest.has("channels")) {
      dest.set("channels", dest.createNode({}));
    }
    if(!dest.has("operations")) {
      dest.set("operations", dest.createNode({}));
    }
    if(!dest.has("components")) {
      dest.set("components", dest.createNode({}));
    }
    if(!dest.hasIn(["components", "messages"])) {
      dest.setIn(["components", "messages"], dest.createNode({}));
    }

    source.messages.forEach((message) => {

      let msg = dest.getIn(["components", "messages", message.action]);
      if (!msg) {
        msg = dest.createNode({});
        dest.addIn(["components", "messages"], {key: message.action, value: msg});
      }
      msg.set("title", message.title);
      msg.set("summary", message.description);
      msg.set("payload", dest.createNode({
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: [message.action]
          },
          ...message?.properties ?? {},
        }
      }));

      dest.setIn(["components", "messages", message.action], msg);

      let chan = dest.getIn(["channels", message.action]);
      if (!chan) chan = dest.createNode({});
      chan.set("title", message.title);
      chan.set("address", message.action);
      chan.set("servers", dest.createNode([
        { "$ref": "#/servers/websocket"}
      ]));
      chan.set("messages", dest.createNode({
        [message.action]: {
          "$ref": "#/components/messages/" + message.action
        }
      }));

      dest.setIn(["channels", message.action], chan);

      let ops = [{key: message.action, mode: message.mode ?? "send"}];
      if (message?.mode === "both") {
        ops = [
          {key: "send:" + message.action, mode: "send"},
          {key: "receive:" + message.action, mode: "receive"}
        ];
      }
      for (const opInfo of ops) {
        let op = dest.getIn(["operations", opInfo.key]);
        // console.log(op);
        if (!op) op = dest.createNode({});
        op.set("title", message.title);
        op.set("summary", message.description);
        op.set("action", opInfo.mode);
        op.set("channel", dest.createNode({
          "$ref": "#/channels/" + message.action
        }));
        op.set("messages", dest.createNode([
          {
            "$ref": "#/channels/" + message.action + "/messages/" + message.action
          }
        ]));
        if (opInfo.mode === "send" && message?.reply) {
          op.set("reply", dest.createNode({
            channel: { "$ref": "#/channels/" + message.reply },
            messages: [
              { "$ref": "#/channels/" + message.reply + "/messages/" + message.reply }
            ]
          }));
        }
        dest.setIn(["operations", opInfo.key], op);
      }
    })
    await outputYamlFile("./asyncapi.yaml", dest);
}

await main()
