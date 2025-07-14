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

cd /project/liorr/dmaprime/visualization_data/scripts

updated_dashboards=0
lior_file="lior.txt"
touch "$lior_file"
echo "Disease Outbreak data processing - $(printf '%(%Y-%m-%d)T\n' -1)" > $lior_file
echo "Visit dmaprime.clemson.edu/data-approval to preview and approve data." >> $lior_file

# Disease Outbreak (Other Infectious Diseases)
echo "Disease Outbreak" >> temp.txt
diff -r --brief $latest_backup/aggregated/other_diseases ../aggregated/other_diseases
if [[ $? -ne 0 ]]; then # new data!
    # process data
    /project/liorr/dmaprime/visualization_data/scripts/.venv/bin/python /project/liorr/dmaprime/visualization_data/scripts/process_other_infectious_diseases_data.py &>> temp.txt
    if [ $? -ne 0 ]; then # error during processing
        python3 sendmail.py gausten@clemson.edu "DMA-PRIME Disease Outbreak Data Processing Errors" "$(cat temp.txt)"
    else # successful processing
        # encrypt
        /project/liorr/dmaprime/visualization_data/scripts/.venv/bin/python encrypt.py "/project/liorr/dmaprime/visualization_data/download/supplementary/encrypt_key.bin" "/project/liorr/dmaprime/visualization_data/processed/other_infectious_diseases" "/project/liorr/dmaprime/visualization_data/download/processed/other_infectious_diseases"
        # copy encryption key
        cp /project/liorr/dmaprime/visualization_data/download/supplementary/encrypt_key.bin /project/liorr/dmaprime/visualization_data/download/processed/other_infectious_diseases/
        # update date of last change file
        printf '%(%Y-%m-%d)T\n' -1 > /project/liorr/dmaprime/visualization_data/download/processed/other_infectious_diseases/date.txt
        
        # logging
        echo "Disease Outbreak has new data." >> $lior_file
        python3 sendmail.py liorr@clemson.edu "DMA-PRIME Disease Outbreak Data Update" "$(cat $lior_file)"
    fi
fi

rm temp.txt

