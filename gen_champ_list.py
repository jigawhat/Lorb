# Python script to generate champion info list for Lorb front end

import json
import requests

ddrag_ver = "8.20.1"

url = "https://ddragon.leagueoflegends.com/cdn/" + ddrag_ver + "/data/en_US/champion.json"

champions = requests.get(url).json()["data"]

idents = list(champions.keys())
idents.sort()

champ_list = [[-1, "None", "None [unknown]"]]

for ident in idents:
    ch = champions[ident]
    champ_list.append([int(ch['key']), ch["id"], ch["name"]])

with open("public/champ_list.json", 'w') as f:
    json.dump(champ_list, f)


