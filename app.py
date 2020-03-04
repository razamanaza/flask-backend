from flask import Flask
from flask import render_template
from mongoengine import *

app = Flask(__name__)

connect('countries')

class Country(Document):
    name = StringField()

@app.route('/')
def index():
  return render_template('index.html')

@app.route('/visual')
def visual():
  russia = Country(name = 'Russia')
  russia.save()
  nz = Country(name = 'New Zealand')
  nz.save()
  countries = []
  for c in Country.objects:
    countries.append(c.name)
  return render_template('visual.html', countries = countries)

@app.route('/inspirations')
def inspirations():
  return render_template('inspirations.html')

@app.errorhandler(404)
def not_found(e):
  return render_template('404.html')

if __name__ =='__main__':
  app.run(debug=True,port=8080,host='0.0.0.0')
