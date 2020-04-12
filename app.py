from flask import Flask
from flask import render_template
from flask import json
from mongoengine import *
import os
import csv
import re
from werkzeug.exceptions import InternalServerError

app = Flask(__name__)

app.config.from_object('config')
connect(
  'countries',
  host=app.config['DBHOST'],
  username=app.config['DBUSER'],
  password=app.config['DBPASS'])

class Country(Document):
    name = StringField()
    data = DictField()

def getCountriesList():
  countries = Country.objects.only('name')
  result = {}
  for c in countries:
    result[c.name] = str(c.id)
  return result

### Routes ###

@app.route('/')
def index():
  return render_template('index.html')

@app.route('/visual')
def visual():
  countries = sorted(getCountriesList().items())
  return render_template('visual.html', countries = countries)

@app.route('/inspirations')
def inspirations():
  return render_template('inspirations.html')

@app.route('/documentation')
def documentation():
  return render_template('documentation.html')

##### API ####

@app.route('/countries', methods=['GET'])
@app.route('/countries/<country_id>', methods=['GET'])
def getCountries(country_id=None):
  try:
    if country_id is None:
      countries = getCountriesList()
      return json.dumps(countries), 200
    else:
      #Check country_id format
      pattern = re.compile("^(\d|\w){24}$")
      isValid = pattern.match(country_id)
      if isValid is None:
        return json.dumps({ 'code': '400', 'description': 'Wrong country id' }), 400
      countries = Country.objects.get(id=country_id)
      return countries.to_json(), 200
  except Exception as e:
    return json.dumps({ 'code': '404', 'description': 'No country with such id', 'exception': str(e) }), 404

@app.route('/countries', methods=['POST'])
def addCountry(country_id):
  return

@app.route('/countries/<country_id>', methods=['DELETE'])
def deleteCountry(country_id):
  return

@app.route('/loadData')
def loadData():
  #Clean table before loading data
  for c in Country.objects:
    c.delete()
  for file in os.listdir(app.config['FILES_FOLDER']):
    filename = os.fsdecode(file)
    path = os.path.join(app.config['FILES_FOLDER'], filename)
    f = open(path)
    r = csv.DictReader(f)
    d = list(r)
    dataset = filename.replace(".csv","")
    for data in d:
        dict = {}
        for key in data:
          if key == 'country':
            #Check for the country existense in the database
            try:
              Country.objects.get(name = data[key])
              isCountryExists = True
            except DoesNotExist:
              isCountryExists = False

            if isCountryExists:
              country = Country.objects.get(name = data[key])
            else:
              country = Country(name = data[key])

          else:
            dict[key] = data[key]
        country.data[dataset] = dict
        country.save()

  return render_template('success.html'), 200

#### Error handler ####

@app.errorhandler(404)
def not_found(e):
  return render_template('404.html')

@app.errorhandler(InternalServerError)
def handle_500(e):
  original = getattr(e, "original_exception", None)
  return render_template("5xx.html", e=original), 500


if __name__ =='__main__':
  app.run(debug=True,port=8080,host='0.0.0.0')


