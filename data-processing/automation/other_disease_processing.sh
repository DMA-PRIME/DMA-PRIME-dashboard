#!/bin/bash

#SBATCH --job-name DMA-PRIME-other-disease-data-processing
#SBATCH --partition=dmaprime
#SBATCH --nodes 1
#SBATCH --ntasks 1
#SBATCH --cpus-per-task 1
#SBATCH --mem 4gb
#SBATCH --time 00:20:00
#SBATCH --output=/dev/null
#SBATCH --error=/dev/null

visualization_data_dir="/project/liorr/dmaprime/visualization_data"

cd $visualization_data_dir/scripts/automation

updated_dashboards=0
lior_file="lior.txt"
touch "$lior_file"
echo "Disease Outbreak data processing - $(printf '%(%Y-%m-%d)T\n' -1)" > $lior_file
echo "Visit dmaprime.clemson.edu/data-approval to preview and approve data." >> $lior_file

# most recent backup
latest_backup=$(ls -td  $visualization_data_dir/backup/* | head -1)

# Disease Outbreak (Other Infectious Diseases)
echo "Disease Outbreak" >> temp.txt
diff -r --brief $latest_backup/aggregated/other_diseases $visualization_data_dir/aggregated/other_diseases
if [[ $? -ne 0 ]]; then # new data!
    # process data
    $visualization_data_dir/scripts/.venv/bin/python $visualization_data_dir/scripts/python_scripts/process_other_infectious_diseases_data.py &>> temp.txt
    if [ $? -ne 0 ]; then # error during processing
        $visualization_data_dir/scripts/.venv/bin/python $visualization_data_dir/scripts/python_scripts/sendmail.py gausten@clemson.edu "DMA-PRIME Disease Outbreak Data Processing Errors" "$(cat temp.txt)"
    else # successful processing
        # encrypt
        $visualization_data_dir/scripts/.venv/bin/python $visualization_data_dir/scripts/python_scripts/encrypt.py "$visualization_data_dir/download/supplementary/encrypt_key.bin" "$visualization_data_dir/processed/other_infectious_diseases" "$visualization_data_dir/download/processed/other_infectious_diseases"
        # copy encryption key
        cp $visualization_data_dir/download/supplementary/encrypt_key.bin $visualization_data_dir/download/processed/other_infectious_diseases/
        # update date of last change file
        printf '%(%Y-%m-%d)T\n' -1 > $visualization_data_dir/download/processed/other_infectious_diseases/date.txt
        
        # logging
        echo "Disease Outbreak has new data." >> $lior_file
        $visualization_data_dir/scripts/.venv/bin/python $visualization_data_dir/scripts/python_scripts/sendmail.py liorr@clemson.edu "DMA-PRIME Data Processing Report" "$(cat $lior_file)"
        $visualization_data_dir/scripts/.venv/bin/python $visualization_data_dir/scripts/python_scripts/sendmail.py ambleic@clemson.edu "DMA-PRIME Data Processing Report" "$(cat $lior_file)"
        $visualization_data_dir/scripts/.venv/bin/python $visualization_data_dir/scripts/python_scripts/sendmail.py eserman@clemson.edu "DMA-PRIME Data Processing Report" "$(cat $lior_file)"
    fi
fi

rm temp.txt
