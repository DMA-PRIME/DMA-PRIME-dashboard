population = [
    24527, 170872, 8688, 202558, 14066, 20866, 192122, 227907, 14553, 411406,
    57300, 32244, 45650, 33745, 37677, 66618, 30479, 162809, 27260, 22347, 138293,
    62680, 523542, 70811, 19222, 354081, 30073, 66551, 98012, 67493, 16828,
    298750, 30657, 26118, 9463, 38440, 79546, 86175, 126884, 415759, 20473,
    319785, 106721, 27316, 30368, 280979,
]

counties = [
    "abbeville",
    "aiken",
    "allendale",
    "anderson",
    "bamberg",
    "barnwell",
    "beaufort",
    "berkeley",
    "calhoun",
    "charleston",
    "cherokee",
    "chester",
    "chesterfield",
    "clarendon",
    "colleton",
    "darlington",
    "dillon",
    "dorchester",
    "edgefield",
    "fairfield",
    "florence",
    "georgetown",
    "greenville",
    "greenwood",
    "hampton",
    "horry",
    "jasper",
    "kershaw",
    "lancaster",
    "laurens",
    "lee",
    "lexington",
    "marion",
    "marlboro",
    "mcCormick",
    "newberry",
    "oconee",
    "orangeburg",
    "pickens",
    "richland",
    "saluda",
    "spartanburg",
    "sumter",
    "union",
    "williamsburg",
    "york",
]

import pandas as pd

df = pd.DataFrame()
df["county"] = counties
df["population"] = population


df.to_csv("countyPopulations.csv", index=False)

# for item in zipped:
#     print(item)
