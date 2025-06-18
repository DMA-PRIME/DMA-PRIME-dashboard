import pandas as pd
import json
import geojson
import os
import glob

from supporting_files.utility import *

diseases = {}
# date_format = "%Y-%m-%d"
date_format = {
    'zcta': "%Y-%m-%d",
    'region': "%Y-%m-%d",
    'county': "%Y-%m-%d",
    'state-cdc': "%Y-%m-%d",
    'state': "%Y-%m-%d"
}
imputation_format = "%Y-%m-%d"

label_dict = {
        'health-system-data': 'Health System hospitalizations', 
        'state-training': 'Projected Cases(train)', 
        'state-testing': 'Projected Cases(post training)',
        'state-data': 'Statewide hospitalizations',
        }

region_sizes = ['county', 'region', 'zcta', 'state']
region_identifiers = { # identifier key for geographic unit within the geojson file
    'zcta': 'ZCTA',
    'region': 'Region',
    'county': 'NAME',
    'state': 'Region',
}
region_csv_identifiers = { # identifier key for geographic unit within the csv data files
    'zcta': 'Region',
    'region': 'Region',
    'county': 'Region',
    'state': None,
}

for region_size in region_sizes:
    def fix_disease_dir(directory):
        disease = directory.split(',')[0]
        disease = disease.lower()
        disease = disease.split('(')[0]
        disease = disease.strip()
        disease = '-'.join(disease.split(' '))
        return disease
    diseases.update({fix_disease_dir(directory.name):directory.name for directory in filter(lambda entry: entry.is_dir() and not 'CDC' in entry.name, os.scandir(f'{aggregated_data_dir}/respiratory/'+region_size))})

dataframes = {}
max_date = pd.to_datetime(0)
date = pd.to_datetime(0)

for region_size, identifier_column in region_csv_identifiers.items():
    dataframes[region_size] = {}
    index_names = [region_size, 'date']
    files = {}
    for disease, dir_name in diseases.items():
        disease_files = glob.glob(f'{aggregated_data_dir}/respiratory/{region_size}/{dir_name}/*.csv')
        files[disease] = []
        if isinstance(disease_files, str):
            files[disease].append({
                    'file': disease_files,
                    'imputation': 'imputation' in disease_files
                })
        else:
            for disease_file in disease_files:
                files[disease].append({
                    'file': disease_file,
                    'imputation': 'imputation' in disease_file.lower() or 'impute' in disease_file.lower()
                })

    # load data files, combine and mark imputed if necessary
    # find max date across all diseases
    for disease, file in files.items():
        df = pd.DataFrame()
        if isinstance(file, list):
            for f in file:
                temp = pd.read_csv(f['file'], date_format=date_format[region_size], parse_dates=['Date'])
                temp['imputation'] = f['imputation']
                temp.rename({'Date': 'date'}, axis=1, inplace=True)
                temp.rename({identifier_column: region_size}, axis=1, inplace=True)
                if f['imputation']:
                    temp['date'] = pd.to_datetime(temp['date'], format=imputation_format) + pd.DateOffset(days=6)
                else:
                    temp['date'] = pd.to_datetime(temp['date'], format=date_format[region_size]) + pd.DateOffset(days=6)

                df = pd.concat([df, temp])
        else:
            df = pd.read_csv(file)
            df['imputation'] = False

        try:
            max_date = max(max_date, df['date'].max())
            if 'Health System hospitalizations' in df.columns:
                date = max(date, df.loc[~df['Health System hospitalizations'].isna()]['date'].max())
            value_columns = df.columns.difference(index_names)
            dataframes[region_size][disease] = pd.pivot_table(df, values=value_columns, index=index_names)
        except:
            if 'date' in df.columns:
                df.index = df['date']
            dataframes[region_size][disease] = df
        
    # find display date and date arrays for historical and prediction data
    date = max(date, max_date - pd.DateOffset(weeks=4))

day_of_week = pd.to_datetime(date).day_name()
start_date = date - pd.DateOffset(weeks=78) # roughly 18 months
historical_dates = pd.date_range(end=date, start=start_date, freq=f'W-{day_of_week[:3].upper()}')
historical_dates = historical_dates.to_list()

end_date = max_date
pred_dates = pd.date_range(start=date, end=end_date, freq=f'W-{day_of_week[:3].upper()}', inclusive='both')
pred_dates = pred_dates.to_list()

for region_size, identifier_column in region_identifiers.items():
    print(region_size)
    with open(f'{scripts_supporting_files_dir}/sc_{region_size}_population_simplified.json') as f:
        gj = geojson.load(f)
        
        # reshape data
        for thing in gj.features:
            try:
                identifier = int(thing.properties[identifier_column])
            except ValueError:
                identifier = thing.properties[identifier_column]

            thing.properties['id'] = identifier
            
            disease_data = {}
            for disease, df in dataframes[region_size].items():
                identifier_dict = {}
                for name, column in label_dict.items():
                    try:
                        if (df.index.nlevels > 1):
                            data = df.xs(identifier, axis=0)
                        else:
                            data = df
                        data = data[column].reindex(historical_dates).dropna()
                        
                        identifier_dict[name] = {
                                'start-date': data.index[0].strftime('%Y-%m-%d'),
                                'data': data.to_list(),
                            }
                    # if data doesn't exist then add data source with empty array
                    except (KeyError, IndexError) as e:
                        identifier_dict[name] = {
                                'start-date': date.strftime('%Y-%m-%d'),
                                'data': [],
                            }
                    except ValueError as e:
                        print(identifier, name, disease)
                        raise e
                try:
                    if (df.index.nlevels > 1):
                        data = df.xs(identifier, axis=0)
                    else:
                        data = df
                    data = data['Projected Cases(post training)'].reindex(pred_dates).dropna()
                    identifier_dict['state-prediction'] = {
                            'start-date': data.index[0].strftime('%Y-%m-%d'),
                            'data': data.to_list(),
                        }
                except (KeyError, IndexError) as e:
                    identifier_dict['state-prediction'] = {
                        'start-date': date.strftime('%Y-%m-%d'),
                        'data': [],
                    } 
                    
                try:
                    if (df.index.nlevels > 1):
                        identifier_dict['imputation'] = int(df.xs(identifier, axis=0)['imputation'].any())
                    else:
                        identifier_dict['imputation'] = int(df['imputation'].any())
                except KeyError as e:
                    identifier_dict['imputation'] = 0

                # makes state testing and training look pretty and connect when plotted
                if len(identifier_dict['state-testing']['data']) > 0 and len(identifier_dict['state-training']['data']) > 0:
                    identifier_dict['state-training']['data'].append(identifier_dict['state-testing']['data'][0])
            
                disease_data[disease] = identifier_dict

            thing.properties['data'] = disease_data

        with open(f'{processed_data_dir}/respiratory/respiratory_{region_size}_hospitalization_data.json', 'w') as f:
            geojson.dump(gj, f)

with open(f'{processed_data_dir}/respiratory/metadata.json', 'w') as f:
    metadata = {
        'diseases': diseases,
        'region_sizes': {
            'state': 'State',
            'region': 'Region',
            'county': 'County',
            'zcta': 'Zip Code',
        },
        'start_date': start_date.strftime('%Y-%m-%d'),
        'current_week': date.strftime('%Y-%m-%d'),
        'end_date': end_date.strftime('%Y-%m-%d')
    }
    json.dump(metadata, f)

# create state CDC hospitalization json file

# read in cdc hosp data and reformat
csvs = glob.glob(f'{aggregated_data_dir}/respiratory/state/CDC_hospitalization/*.csv')
state_csv = max(csvs, key=os.path.getctime)
if len(csvs) > 0:
    state_cdc = pd.read_csv(state_csv)
    state_cdc['Week.Ending.Date'] = pd.to_datetime(state_cdc['Week.Ending.Date'], format=date_format['state-cdc'])
    
    # =========================== delete me ===============================
    temp_state_dow = state_cdc['Week.Ending.Date'][0].day_of_week
    temp_ref_dow = pd.to_datetime(date).day_of_week
    if temp_state_dow != temp_ref_dow:
        if abs(temp_ref_dow - temp_state_dow) < temp_ref_dow - temp_state_dow + 7:
            state_cdc['Week.Ending.Date'] = state_cdc['Week.Ending.Date'] + pd.DateOffset(days=temp_ref_dow - temp_state_dow)
        else:
            state_cdc['Week.Ending.Date'] = state_cdc['Week.Ending.Date'] + pd.DateOffset(days=temp_ref_dow - temp_state_dow + 7)
    # =====================================================================
    
    state_cdc = state_cdc[(start_date <= state_cdc['Week.Ending.Date']) & (state_cdc['Week.Ending.Date'] <= date)]
    state_cdc.index = state_cdc['Week.Ending.Date']
    
    # create df that will hold the data
    df = pd.DataFrame(columns=['Date'])
    df['Date'] = state_cdc['Week.Ending.Date']
    df.index = df['Date']
    for disease in diseases.keys():
        # add cdc data to df
        column = list(filter(lambda x: f'total.{".".join(disease.split("-"))}.admissions' == x.lower(), state_cdc.columns))
        if disease == 'respiratory-syncytial-virus':
            column = list(filter(lambda x: f'total.rsv.admissions' == x.lower(), state_cdc.columns))
        if len(column) == 1:
            df[disease] = state_cdc[column[0]]
    
    # save df to json file
    df = df.drop('Date', axis=1)
    df.index = df.index.strftime(date_format['state-cdc'])
else:
    df = pd.DataFrame()

df.to_json(f'{processed_data_dir}/respiratory/respiratory_state-cdc_hospitalization_data.json', orient='columns')
