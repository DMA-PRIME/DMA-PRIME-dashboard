# This is where the main flask code should lie

from flask import Flask, jsonify, render_template, request
import os
import pandas as pd
import numpy as np
import pandas as pd
import glob

from .definitions import counties

# Data:
#    map, county, zip code
#        past, current, prediction
#            prediction history vs actual

county_dict = {}

def create_app(test_config=None):
    # create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    # ^ app is refered to with the decorators. It can be named whatever you want but you then do @name instead of @app

    app.config.from_mapping(
        SECRET_KEY='dev',
        # DATABASE=os.path.join(app.instance_path, 'flaskr.sqlite'),
    )

    if test_config is None:
        # load the instance config, if it exists, when not testing
        app.config.from_pyfile('config.py', silent=True)
    else:
        # load the test config if passed in
        app.config.from_mapping(test_config)

    # ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass


    # a simple page that says hello
    @app.route('/')
    def index():
        return render_template("index.html")
    
    @app.route('/hospital/<id>')
    def getHospitalHTML(id):
        return render_template("subtemplates/hospital.html", id=id)
    
    @app.route('/tooltip/<type>')
    def getTooltipHTML(type=None):
        return render_template("subtemplates/tooltip.html", type=type)
    
    @app.route('/get-prediction/<mapType>/<region>', methods=['POST', 'GET'])
    def getPrediction(mapType="county", region="all"):
        # if we're showing all, get max day
        # if we're showing one specific region, show all values until max predicted day
        if region == "all":
            if mapType == "county":
                items = request.get_json()
                values = (np.random.rand(len(items)) - .5) * 20
                values_list = []
                for pair in zip(items, values):
                    values_list.append({"item":pair[0], "value":pair[1]})
                quantiles = [min(values), np.quantile(values, .20), np.quantile(values, .40), 
                             np.quantile(values, .60), np.quantile(values, .80), max(values)]
                response = jsonify({
                    "values": values_list,
                    "min": min(values),
                    "max": max(values),
                    "quantiles": quantiles,
                })
                return response
            if mapType == "zip":
                return "0"

    
    loadData()
    # print(county_dict)

    return app

def loadData():
    for county in counties:
        temp = {}
        daily_path = glob.glob("**/static/data/county/Counties daily cases/" + county +"_case_daily.csv", recursive=True)[0]
        real_path = glob.glob("**/static/data/county/Counties daily cases/" + county +"_case_daily.csv", recursive=True)[0]

        temp["daily"] = pd.read_csv(daily_path)
        temp["real"] = pd.read_csv(real_path)
        county_dict["county"] = temp
