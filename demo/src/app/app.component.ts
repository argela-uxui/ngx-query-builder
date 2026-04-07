import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Component, inject } from '@angular/core';
import { JsonPipe } from '@angular/common';
import {
  QueryBuilderModule,
  QueryBuilderConfig,
} from 'ngx-query-builder';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    JsonPipe,
    QueryBuilderModule,
  ],
  styleUrl: 'app.component.scss',
  template: `
    <div class="demo-container">
      <h1>ngx-query-builder Demo</h1>

      <section>
        <h2>Query Builder</h2>
        <div data-testid="query-builder">
          <query-builder [formControl]="queryCtrl" [config]="currentConfig" [allowRuleset]="allowRuleset"
            [allowCollapse]="allowCollapse" [persistValueOnFieldChange]="persistValueOnFieldChange">
            <ng-container *queryInput="let rule; type: 'textarea'; let getDisabledState=getDisabledState">
              <textarea class="text-input text-area" [(ngModel)]="rule.value" [disabled]="getDisabledState()"
                placeholder="Custom Textarea" data-testid="custom-textarea"></textarea>
            </ng-container>
          </query-builder>
        </div>
      </section>

      <section class="controls">
        <h2>Controls</h2>
        <div class="controls-grid">
          <label class="control-item">
            <input type="checkbox" (change)="switchModes($event)" data-testid="toggle-entity-mode">
            <span>Entity Mode</span>
          </label>
          <label class="control-item">
            <input type="checkbox" (change)="changeDisabled($event)" data-testid="toggle-disabled">
            <span>Disabled</span>
          </label>
          <label class="control-item">
            <input type="checkbox" [(ngModel)]="allowRuleset" data-testid="toggle-allow-ruleset">
            <span>Allow Ruleset</span>
          </label>
          <label class="control-item">
            <input type="checkbox" [(ngModel)]="allowCollapse" data-testid="toggle-allow-collapse">
            <span>Allow Collapse</span>
          </label>
          <label class="control-item">
            <input type="checkbox" [(ngModel)]="persistValueOnFieldChange" data-testid="toggle-persist-value">
            <span>Persist Value on Field Change</span>
          </label>
        </div>
        <div class="status-row">
          <span class="badge" [class.valid]="queryCtrl.valid" [class.invalid]="!queryCtrl.valid" data-testid="badge-valid">
            {{ queryCtrl.valid ? 'Valid' : 'Invalid' }}
          </span>
          <span class="badge" [class.active]="queryCtrl.touched" data-testid="badge-touched">
            {{ queryCtrl.touched ? 'Touched' : 'Untouched' }}
          </span>
        </div>
      </section>

      <section>
        <h2>Query Output</h2>
        <pre class="output" data-testid="query-output">{{ query | json }}</pre>
      </section>
    </div>
  `,
})
export class AppComponent {
  public queryCtrl: FormControl;

  private readonly formBuilder = inject(FormBuilder);

  public query = {
    condition: 'and',
    rules: [
      {field: 'age', operator: '<=', value: 30, entity: 'physical'},
      {field: 'name', operator: '=', value: 'Alice', entity: 'nonphysical'},
      {field: 'birthday', operator: '=', value: '2000-01-01', entity: 'nonphysical'},
      {field: 'meetingTime', operator: '=', value: '09:00', entity: 'nonphysical'},
      {field: 'gender', operator: '=', value: 'm', entity: 'physical'},
      {field: 'educated', operator: '=', value: true, entity: 'nonphysical'},
      {field: 'tags', operator: 'in', value: ['angular', 'typescript'], entity: 'nonphysical'},
      {field: 'school', operator: 'is null', entity: 'nonphysical'},
      {field: 'notes', operator: '=', value: '', entity: 'nonphysical'},
      {
        condition: 'or',
        rules: [
          {field: 'occupation', operator: 'in', entity: 'nonphysical'},
        ]
      }
    ]
  };

  public entityConfig: QueryBuilderConfig = {
    entities: {
      physical: {name: 'Physical Attributes'},
      nonphysical: {name: 'Nonphysical Attributes'}
    },
    fields: {
      age: {name: 'Age', type: 'number', entity: 'physical'},
      gender: {
        name: 'Gender',
        entity: 'physical',
        type: 'category',
        options: [
          {name: 'Male', value: 'm'},
          {name: 'Female', value: 'f'}
        ]
      },
      name: {name: 'Name', type: 'string', entity: 'nonphysical'},
      notes: {name: 'Notes', type: 'textarea', operators: ['=', '!='], entity: 'nonphysical'},
      educated: {name: 'College Degree?', type: 'boolean', entity: 'nonphysical'},
      birthday: {
        name: 'Birthday', type: 'date', operators: ['=', '<=', '>'],
        defaultValue: (() => new Date()), entity: 'nonphysical'
      },
      meetingTime: {name: 'Meeting Time', type: 'time', entity: 'nonphysical'},
      tags: {
        name: 'Tags',
        type: 'multiselect',
        operators: ['in', 'not in'],
        options: [
          {name: 'Angular', value: 'angular'},
          {name: 'TypeScript', value: 'typescript'},
          {name: 'RxJS', value: 'rxjs'},
          {name: 'Node.js', value: 'nodejs'}
        ],
        entity: 'nonphysical'
      },
      school: {name: 'School', type: 'string', nullable: true, entity: 'nonphysical'},
      occupation: {
        name: 'Occupation',
        entity: 'nonphysical',
        type: 'category',
        options: [
          {name: 'Student', value: 'student'},
          {name: 'Teacher', value: 'teacher'},
          {name: 'Unemployed', value: 'unemployed'},
          {name: 'Scientist', value: 'scientist'}
        ]
      }
    }
  };

  public config: QueryBuilderConfig = {
    fields: {
      age: {name: 'Age', type: 'number'},
      gender: {
        name: 'Gender',
        type: 'category',
        options: [
          {name: 'Male', value: 'm'},
          {name: 'Female', value: 'f'}
        ]
      },
      name: {name: 'Name', type: 'string'},
      notes: {name: 'Notes', type: 'textarea', operators: ['=', '!=']},
      educated: {name: 'College Degree?', type: 'boolean'},
      birthday: {
        name: 'Birthday', type: 'date', operators: ['=', '<=', '>'],
        defaultValue: (() => new Date())
      },
      meetingTime: {name: 'Meeting Time', type: 'time'},
      tags: {
        name: 'Tags',
        type: 'multiselect',
        operators: ['in', 'not in'],
        options: [
          {name: 'Angular', value: 'angular'},
          {name: 'TypeScript', value: 'typescript'},
          {name: 'RxJS', value: 'rxjs'},
          {name: 'Node.js', value: 'nodejs'}
        ]
      },
      school: {name: 'School', type: 'string', nullable: true},
      occupation: {
        name: 'Occupation',
        type: 'category',
        options: [
          {name: 'Student', value: 'student'},
          {name: 'Teacher', value: 'teacher'},
          {name: 'Unemployed', value: 'unemployed'},
          {name: 'Scientist', value: 'scientist'}
        ]
      }
    }
  };

  public currentConfig: QueryBuilderConfig;
  public allowRuleset = true;
  public allowCollapse = false;
  public persistValueOnFieldChange = false;

  constructor() {
    this.queryCtrl = this.formBuilder.control(this.query);
    this.currentConfig = this.config;
  }

  switchModes(event: Event): void {
    this.currentConfig = (event.target as HTMLInputElement).checked ? this.entityConfig : this.config;
  }

  changeDisabled(event: Event): void {
    (event.target as HTMLInputElement).checked ? this.queryCtrl.disable() : this.queryCtrl.enable();
  }
}

