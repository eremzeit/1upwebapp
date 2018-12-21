import React from 'react'
import Link from 'next/link'
import fetch from 'isomorphic-fetch'
import { authenticate, logout, logoutEvent } from '../utils'
import Header from '../components/header.js'
import FhirPatient from '../components/fhir/patient.js'
import FhirAllergyIntolerance from '../components/fhir/allergyintolerance.js'
import FhirCondition from '../components/fhir/condition.js'
import Observation from '../components/fhir/elements/observation.js'

export default class Dashboard extends React.Component {
  static async getInitialProps ({ req, res }) {
    const user = await authenticate(req, res)
    if (typeof req === 'undefined'){
      let dashboard = await fetch(
        `http://localhost:3000/api/dashboard`,
        {credentials: 'include'}
      ).then(r=>r.json());
      return { dashboard, user }
    } else {
      let authHeader = {
        'Authorization': 'Bearer ' + req.session.oneup_access_token
      }
      let dashboard = await fetch(
        `http://localhost:3000/api/dashboard`,
        {headers: authHeader}
      ).then(r=>r.json());
      return { dashboard, user }
    }
  }

  componentDidMount () {
    if (this.props.user) {
      try {
        window.localStorage.setItem('email', this.props.user.email)
        window.localStorage.setItem('oneup_access_token', this.props.user.oneup_access_token)
      } catch (err) {}
    } else {
      window.localStorage.remove('email')
      window.localStorage.remove('oneup_access_token')
    }
  }
  resourceComponent (resourceType, resource) {
    switch (resourceType){
      case 'Patient':
        return <FhirPatient {...resource} />
      case 'Condition':
        return <FhirCondition {...resource} />
      case 'AllergyIntolerance':
        return <FhirAllergyIntolerance {...resource} />
      case 'Observation':
        return <Observation {...resource} />
      default:
        return JSON.stringify(resource)
    }
  }

  render () {
    return (
      <div>
        <Header user={this.props.user} />
        <h1>Your medical dashboard </h1>
        <br/>
        <div>{typeof this.props.dashboard.resources.Patient !== 'undefined' && this.props.dashboard.resources.Patient.entry.length > 0 ? '' : (
          <div>
            <br />
            <br />
            <br />
            Looks like you have no patient data
            <br />
            <Link><a href='/'>Connect some health systems</a></Link>
          </div>
        )}</div>
        <div>
          {["Patient","Condition","AllergyIntolerance","Encounter","Observation","MedicationDispense","Coverage","ExplanationOfBenefit","ReferralRequest"].map(function(resourceType){
            return (<div>
              {this.props.dashboard.resources[resourceType].entry.length > 0 ? <h2>{resourceType}</h2> : ''}
              {this.props.dashboard.resources[resourceType].entry.map(function(resource){
                return (<div style={{textAlign: 'left', marginTop:'-4px'}}>
                  {
                    this.resourceComponent(resourceType, resource)
                  }
                </div>)
              }.bind(this))}
            <br />
            </div>)
          }.bind(this))}
        </div>
        <style jsx>{`
          div {
            text-align: center;
          }
        `}</style>
      </div>
    )
  }
}
