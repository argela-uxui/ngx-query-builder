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
  template: `
    <div class="demo-container">
      <h1>ngx-query-builder Demo</h1>

      <section>
        <h2>Query Builder</h2>
        <query-builder [formControl]="queryCtrl" [config]="currentConfig" [allowRuleset]="allowRuleset"
          [allowCollapse]="allowCollapse" [persistValueOnFieldChange]="persistValueOnFieldChange">
          <ng-container *queryInput="let rule; type: 'textarea'; let getDisabledState=getDisabledState">
            <textarea class="text-input text-area" [(ngModel)]="rule.value" [disabled]="getDisabledState()"
              placeholder="Custom Textarea"></textarea>
          </ng-container>
        </query-builder>
      </section>

      <section class="controls">
        <h2>Controls</h2>
        <div class="controls-grid">
          <label class="control-item">
            <input type="checkbox" (change)="switchModes($event)">
            <span>Entity Mode</span>
          </label>
          <label class="control-item">
            <input type="checkbox" (change)="changeDisabled($event)">
            <span>Disabled</span>
          </label>
          <label class="control-item">
            <input type="checkbox" [(ngModel)]="allowRuleset">
            <span>Allow Ruleset</span>
          </label>
          <label class="control-item">
            <input type="checkbox" [(ngModel)]="allowCollapse">
            <span>Allow Collapse</span>
          </label>
          <label class="control-item">
            <input type="checkbox" [(ngModel)]="persistValueOnFieldChange">
            <span>Persist Value on Field Change</span>
          </label>
        </div>
        <div class="status-row">
          <span class="badge" [class.valid]="queryCtrl.valid" [class.invalid]="!queryCtrl.valid">
            {{ queryCtrl.valid ? 'Valid' : 'Invalid' }}
          </span>
          <span class="badge" [class.active]="queryCtrl.touched">
            {{ queryCtrl.touched ? 'Touched' : 'Untouched' }}
          </span>
        </div>
      </section>

      <section>
        <h2>Query Output</h2>
        <pre class="output">{{ query | json }}</pre>
      </section>
    </div>
  `,
  styles: [`
    .demo-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      max-width: 900px;
      margin: 30px auto;
      padding: 0 20px;
      color: #333;
    }

    h1 {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 24px;
      color: #1a1a1a;
    }

    h2 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #444;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    section {
      margin-bottom: 32px;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      background: #fafafa;
    }

    .controls-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 12px;
    }

    .control-item {
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      padding: 6px 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      user-select: none;

      &:hover {
        background: #f5f5f5;
      }

      input[type="checkbox"] {
        cursor: pointer;
      }
    }

    .status-row {
      display: flex;
      gap: 8px;
    }

    .badge {
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      background: #eee;
      color: #666;

      &.valid { background: #d4edda; color: #155724; }
      &.invalid { background: #f8d7da; color: #721c24; }
      &.active { background: #fff3cd; color: #856404; }
    }

    .text-input {
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid #ccc;
      font-family: inherit;
      font-size: 13px;
    }

    .text-area {
      width: 300px;
      height: 80px;
      resize: vertical;
    }

    .output {
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 16px;
      border-radius: 4px;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 13px;
      overflow: auto;
      max-height: 300px;
      margin: 0;
    }
  `]
})
export class AppComponent {
  public queryCtrl: FormControl;

  private readonly formBuilder = inject(FormBuilder);

  public query = {
    condition: 'and',
    rules: [
      {field: 'age', operator: '<=', entity: 'physical'},
      {field: 'birthday', operator: '=', value: new Date(), entity: 'nonphysical'},
      {
        condition: 'or',
        rules: [
          {field: 'gender', operator: '=', entity: 'physical'},
          {field: 'occupation', operator: 'in', entity: 'nonphysical'},
          {field: 'school', operator: 'is null', entity: 'nonphysical'},
          {field: 'notes', operator: '=', entity: 'nonphysical'}
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
