from flask import Flask
from flask import render_template
from mongoengine import *
import os
import csv

app = Flask(__name__)

connect('countries', host="127.0.0.1", username='student', password='12345')
app.config.from_object('config')

class Country(Document):
    name = StringField()
    agriculture = DictField()
    industry = DictField()
    service = DictField()

@app.route('/')
def index():
  return render_template('index.html')

@app.route('/visual')
def visual():
  country = Country.objects.get(name = 'Russia')
  return render_template('visual.html', countries = country.to_json())

@app.route('/inspirations')
def inspirations():
  return render_template('inspirations.html')

@app.errorhandler(404)
def not_found(e):
  return render_template('404.html')

@app.route('/countries', methods=['GET'])
@app.route('/countries/<country_id>', methods=['GET'])
def getCountries(country_id=None):
  if country_id is None:
    countries = Country.objects
  else:
    countries = Country.objects.get(id=country_id)
  return countries.to_json()

@app.route('/countries/<country_id>', methods=['POST'])
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
            try:
              Country.objects.get(name = data[key])
            except DoesNotExist:
              isCountryExists = False
            else:
              isCountryExists = True

            if isCountryExists:
              country = Country.objects.get(name = data[key])
            else:
              country = Country(name = data[key])

          else:
            dict[key] = data[key]
        country[dataset] = dict
        country.save()

  return render_template('success.html'), 202


if __name__ =='__main__':
  app.run(debug=True,port=8080,host='0.0.0.0')


