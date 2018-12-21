import React from 'react'
import _ from 'lodash'
import moment from 'moment'

// It might be a good idea to have utilities for pulling fields out of fhir,
// rather than reinventing the wheel in each time.  For example, below I had to read the spec
// to know which field in which circumstances to summarize a CodeableConcept
const summaryTextFromCodeableConcept = (codeableConcept) => {
  if (!codeableConcept) {
    return '';
  }

  // The specs say that the 'text' field is the best to display, unless there's
  // a coding value that is 'userSelected' (ie. the coding value selected by the user directly,
  // which might carry more meaning)
  // https://www.hl7.org/fhir/datatypes.html#CodeableConcept
  const userSelected = _.find(codeableConcept.coding, x => x.userSelected);
  if (userSelected) {
    return userSelected.display;
  } else {
    return codeableConcept.text;
  }
}

const summaryTextFromQuantity = (quantity) => {
  if (quantity.unit) {
    return `${quantity.value} (${quantity.unit})`;
  } else {
    return quantity.value;
  }
}

// observations can have different value types,
const getValueDisplayFromObservation = (observation) => {
  // the observation value can be of different data types.  the exact key name depends on the data
  // type so we have to search for it
  const valueKeys = Object.keys(observation).filter(x => x.startsWith('value'));

  // TODO: handle the case where where's more than one value data type (which the specs imply is rare though possible)
  const key = _.first(valueKeys);

  if (key == 'valueCodeableConcept') {
    return summaryTextFromCodeableConcept(observation[key]);
  } else if (key == 'valueQuantity') {
    return summaryTextFromQuantity(observation[key]);
  } else {
    // TODO: handle other data types
    return observation[key]
  }
}

export default class Observation extends React.Component {
  _renderHeader() {
    const code = _.get(this.props, 'resource.code');
    const codeDisplay = summaryTextFromCodeableConcept(code) || '';
    const valueDisplay = getValueDisplayFromObservation(this.props.resource) || '';

    if (codeDisplay && valueDisplay) {
      const text = `${codeDisplay}: ${valueDisplay}`;
      return (<h2>{text}</h2>);
    } else {
      return [];
    }
  }

  _renderAttributes() {
    const resource = this.props.resource || {};

    const attributeDefs = [
      ['Issue Date', (resource) => {
        const issuedStr = resource.issued;

        // note that in a real app we'd settle on a date format and have
        // utilities for components to use to convert dates to human readable strings
        return issuedStr ? moment(issuedStr).format() : 'unknown';
      }],

      // Might be good to add tooltips to explain what each possible status means
      // Could use icons or graphics to display status (especially for the invalid statuses)
      ['Status', resource => resource.status],

      ['Category', resource => summaryTextFromCodeableConcept(resource.category)],

      // TODO: this will output something like "Patient/23476829" so maybe we should display
      // something that is a bit more useful to the user.  ie. Maybe omit this field if it's
      // about the patient directly but include it if it's something else and then traverse
      // the reference and display the actual entity name
      ['Subject', resource => _.get(resource, 'subject.display')],
      ['Performer', resource => resource.performer],

      ['Code', resource => summaryTextFromCodeableConcept(resource.code)],
      ['Context', resource => _.get(resource, 'context.display')],


      // etc etc, there's a number of other fields defined in the spec for Observation, but
      // I'll handwave those for now since this is a quick takehome.
    ];

    const attributes = attributeDefs.filter(([name, val]) => !!val).map(([name, valFn]) => [name, valFn(resource)]);

    const toRender = attributes.map(([name, val]) => (
      <tr>
        <td className='field-name'>{name}</td>
        <td className='field-val'>{val}</td>
      </tr>
    ));

    return (
      <table>
        <tbody>
          { toRender }
        </tbody>
      </table>
    );
  }

  render () {
    //https://www.hl7.org/fhir/datatypes.html#CodeableConcept
    const resource = this.props.resource;

    return (
      <div className='tile observation'>
        { this._renderHeader() }
        { this._renderAttributes() }
      </div>
    );
  }
}

