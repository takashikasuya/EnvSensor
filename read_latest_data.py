#!/usr/bin/python
# -*- mode: python; coding: utf-8 -*-

from __future__ import print_function

import sys
import json
import paho.mqtt.client as mqtt
from datetime import datetime
from bluetooth.ble import GATTRequester

host = '127.0.0.1'
port = 1883
prefix = "Omron/Env/"

class Reader(object):
    def __init__(self, address):
        self.requester = GATTRequester(address, False)
        self.addr = address
        self.connect()

    def connect(self):
        print("Connecting...", end=' ')
        sys.stdout.flush()

        self.requester.connect(True,'random')
        print("OK!")

    def request_data(self):
        # 0x0019: Latest Data - 19byte
        data = self.requester.read_by_handle(0x0019)[0]
        num = 0
        ret = {}
        for byte in data:
           tmp = ''.join(["%02X" % ord(x) for x in byte]).strip()
           #print('{},{},{}'.format(num,tmp,int(tmp,16)))
           tmp = int(tmp,16)
           if num == 1:
               ret["temperature"] = tmp
           elif num == 2:
               ret["temperature"] += tmp << 8
               ret["temperature"] = float(ret["temperature"])/100
           elif num == 3:
               ret["humidity"] = tmp
           elif num == 4:
               ret["humidity"] += tmp << 8
               ret["humidity"] = float(ret["humidity"])/100
           elif num == 5:
               ret["illuminance"] = tmp
           elif num == 6:
               ret["illuminance"] += tmp << 8
           elif num == 7:
               ret["UVI"] = tmp
           elif num == 8:
               ret["UVI"] += tmp << 8
               ret["UVI"] = float(ret["UVI"])/100
           elif num == 9:
               ret["air_pressure"] = tmp
           elif num == 10:
               ret["air_pressure"] += tmp << 8
               ret["air_pressure"] = float(ret["air_pressure"])/10
           elif num == 11:
               ret["noise"] = tmp
           elif num == 12:
               ret["noise"] += tmp << 8
               ret["noise"] = float(ret["noise"])/100
           elif num == 13:
               ret["discomfort"] = tmp
           elif num == 14:
               ret["discomfort"] += tmp << 8
               ret["discomfort"] = float(ret["discomfort"])/100
           elif num == 15:
               ret["WBGT"] = tmp
           elif num == 16:
               ret["WBGT"] += tmp << 8
               ret["WBGT"] = float(ret["WBGT"])/100
           elif num == 17:
               ret["battery"] = tmp
           elif num == 18:
               ret["battery"] += tmp << 8
               ret["battery"] = float(ret["battery"])/1000
           num += 1
        date = datetime.now().isoformat()
        ret["datetime"] = date
        ret["topic"] = prefix + self.addr
        print(json.dumps(ret))
        return json.dumps(ret)        

def read_device_list(file):
    ret = []
    with open(file) as f:
        for line in f:
            ret.append(line.strip())
    return ret


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: {} <device list file>".format(sys.argv[0]))
        sys.exit(1)
    # check device list file
    list = read_device_list(sys.argv[1])
    client = mqtt.Client(protocol=mqtt.MQTTv311)
    client.connect(host,port=port)
    for addr in list:
        print("Env :" + addr)
        reader = Reader(addr)
        payload = reader.request_data()
        topic = prefix + addr
        client.publish(topic, payload)
    print("Done.")
