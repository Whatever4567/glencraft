import paramiko, socket, threading, sys, time
def handler(chan, origin, server):
    s=socket.create_connection(("127.0.0.1",8787))
    def pipe(a,b,sa):
        try:
            while True:
                d=a.recv(65536)
                if not d: break
                b.sendall(d) if sa else b.send(d)
        except Exception: pass
        finally:
            try: a.close(); b.close()
            except: pass
    threading.Thread(target=pipe,args=(chan,s,True),daemon=True).start()
    threading.Thread(target=pipe,args=(s,chan,False),daemon=True).start()
while True:
    try:
        t=paramiko.Transport(("a.pinggy.io",443)); t.start_client()
        try: t.auth_none("free")
        except paramiko.BadAuthenticationType: t.auth_password("free","")
        t.request_port_forward("",0,handler)
        ch=t.open_session(); ch.get_pty(); ch.invoke_shell()
        while t.is_active():
            if ch.recv_ready(): sys.stdout.write(ch.recv(4096).decode(errors="ignore")); sys.stdout.flush()
            else: time.sleep(0.5)
    except Exception as e: print("ERR",e,flush=True)
    time.sleep(5)
