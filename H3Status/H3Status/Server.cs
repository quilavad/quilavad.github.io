using System.Collections.Generic;
using WebSocketSharp;
using WebSocketSharp.Server;
using SimpleJSON;

namespace H3Status.Server
{
    public class ServerBehavior : WebSocketBehavior
    {
        private static List<ServerBehavior> _instances = new List<ServerBehavior>();

        protected override void OnOpen()
        {
            base.OnOpen();
            _instances.Add(this);

            var eventJSON = new JSONObject();
            eventJSON["type"] = "hello";
            eventJSON["status"] = Patches.VersionHandler.GetVersionInfo();

            this.SendAsync(eventJSON.ToString(), null);
        }

        protected override void OnClose(CloseEventArgs e)
        {
            _instances.Remove(this);
            base.OnClose(e);
        }

        public static void SendMessage(JSONObject json) {
            foreach (var instance in _instances) {
                instance.SendAsync(json.ToString(), null);
            }
        }
    }
}
