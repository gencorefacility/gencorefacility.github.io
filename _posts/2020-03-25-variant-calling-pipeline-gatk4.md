---
layout: post
title: "Variant Calling Pipeline using GATK4"
date: 2020-03-25
author: "Mohammed Khalfan"
featured_image: /assets/images/blog/variant-calling-pipeline-gatk4-featured.png
header_image: /assets/images/header-blog.jpg
comments: true
---

## Introduction

This is an updated version of the [variant calling pipeline](https://gencore.bio.nyu.edu/variant-calling-pipeline/) post published in 2016. This updated version employs GATK4 and is available as a containerized Nextflow script on GitHub.

Identifying genomic variants, including single nucleotide polymorphisms (SNPs) and DNA insertions and deletions (indels), from next generation sequencing data is an important part of scientific discovery. At the NYU Center for Genomics and Systems Biology (CGSB) this task is central to many research programs. For example, the Carlton Lab analyzes SNP data to study population genetics of the malaria parasites *Plasmodium falciparum* and *Plasmodium vivax*. The Gresham Lab uses SNP and indel data to study adaptive evolution in yeast, and the Lupoli Lab in the Department of Chemistry uses variant analysis to study antibiotic resistance in *E. coli*.

To facilitate this research, a bioinformatics pipeline has been developed to enable researchers to accurately and rapidly identify, and annotate, sequence variants. The pipeline employs the Genome Analysis Toolkit 4 (GATK4) to perform variant calling and is based on the best practices for variant discovery analysis outlined by the Broad Institute. Once SNPs have been identified, SnpEff is used to annotate, and predict, variant effects.

This pipeline is intended for calling variants in samples that are clonal - i.e. a single individual. The frequencies of variants in these samples are expected to be 1 (for haploids or homozygous diploids) or 0.5 (for heterozygous diploids). To call variants in samples that are heterogeneous, such as human tumors and mixed microbial populations, in which allele frequencies vary continuously between 0 and 1 researcher should use GATK4 Mutect2 which is designed to identify subclonal events (workflow coming soon).

Base Quality Score Recalibration (BQSR) is an important step for accurate variant detection that aims to minimize the effect of technical variation on base quality scores (measured as Phred scores). As with the [original pipeline](https://gencore.bio.nyu.edu/variant-calling-pipeline/), this pipeline assumes that a 'gold standard' set of SNPS and indels are not available for BQSR. In the absence of a gold standard the pipeline performs an initial step detecting variants without performing BQSR, and then uses the identified SNPs as input for BQSR before calling variants again. This process is referred to as bootstrapping and is the procedure recommended by the Broad Institute's best practices for variant discovery analysis when a gold standard is not available.

This pipeline uses [nextflow](https://www.nextflow.io/), a framework that enables reproducible and portable workflows. The full pipeline and instructions on how to use the Nextflow script are described below.

## Script Location

### greene

```
/scratch/work/cgsb/scripts/variant_calling/gatk4/main.nf
```

1. You don't need to copy the script, but you should copy the file `nextflow.config` from the above directory into a new project directory. (`/scratch/work/cgsb/scripts/variant_calling/gatk4/nextflow.config`)
2. If you want to copy and run the `main.nf` script locally, you must copy the `/bin` directory as well. This needs to be in the same directory as `main.nf`.
3. You will set parameters for your analysis in the `nextflow.config` file.
4. See How to Use and Examples below to learn how to configure and run the script.
5. This Nextflow script uses pre-installed software modules on the NYU HPC, and is tailored to the unique file naming scheme used by the Genomics Core at the NYU CGSB.

### github

[https://github.com/gencorefacility/variant-calling-pipeline-gatk4](https://github.com/gencorefacility/variant-calling-pipeline-gatk4)

1. This version of the script is configured for standard Illumina filenames.
2. This version of the script does not use software modules local to the NYU HPC, it is instead packaged with a Docker container which has all tools used in the pipeline. Integration with Docker allows for completely self-contained and truly reproducible analysis. This example shows how to run the workflow using the container. The container is hosted on Docker at: [https://hub.docker.com/r/gencorefacility/variant-calling-pipeline-gatk4](https://hub.docker.com/r/gencorefacility/variant-calling-pipeline-gatk4)

## Full List of Tools

- GATK4
- BWA
- Picard Tools
- Samtools
- SnpEff
- R (dependency for some GATK steps)

## How to Use This Script

### Setting Up Nextflow

This pipeline is written in Nextflow. The easiest way to get setup is with conda. On NYU HPC, conda is already installed as a module.

```bash
module load anaconda3/2019.10
```

Note: Use `module avail anaconda` to check for the latest conda version.

**Update:** NYU HPC users can load Nextflow using the module load command. There is no need to install via conda. Simply load the module and skip to "Setting Up The Script" below.

For users outside NYU, see conda installation instructions, then follow the rest below.

Once you have conda loaded, add the bioconda channel and others. Important to add them in this order:

```bash
conda config --add channels defaults
conda config --add channels bioconda
conda config --add channels conda-forge
```

Create a conda environment:

```bash
conda create --name nf-env
```

Activate it:

```bash
conda activate nf-env
```

When loaded, you'll see:

```
(nf-env) [user@log-1 ~]$
```

Install nextflow:

```bash
conda install nextflow
```

When finished, deactivate with `conda deactivate`.

### Setting Up The Script

Once you have Nextflow setup, we can run the pipeline. The pipeline requires six mandatory input parameters:

**1) `params.reads`** - The directory with your FastQ libraries, including a glob path matcher. Must include paired end group pattern (i.e. `{1,2}`).

Example:

```
params.reads = "/path/to/data/*_n0{1,2}_*.fastq.gz"
```

or

```
params.reads = "/path/to/data/*_R{1,2}_*.fastq.gz"
```

**2) `params.ref`** - Reference genome in fasta format. If at NYU CGSB, check the Shared Genome Resource (`/scratch/work/cgsb/genomes/Public/`). If using your own reference, you need to build index files for BWA, a fasta index (samtools), and a reference dictionary (Picard Tools), all in the same directory as the reference fasta.

**3) `params.snpeff_db`** - The name of the SnpEff database. To determine it:

```bash
# On the NYU HPC you can load SnpEff using module load
module load snpeff/4.3i

# $SNPEFF_JAR is the path to the snpEff.jar file.
# On the NYU HPC this is automatically set to the
# snpEff.jar path when the module is loaded
java -jar $SNPEFF_JAR databases | grep -i SPECIES_NAME
```

From the list of returned results, select the database you wish to use. The value of the **first** column is the value to input for `params.snpeff_db`.

For example, for Arabidopsis Thaliana:

```bash
java -jar $SNPEFF_JAR databases | grep -i thaliana
```

Output:

```
athalianaTair10   Arabidopsis_Thaliana  http://downloads.sourceforge.net/...
```

Then: `params.snpeff_db='athalianaTair10'`

Note: If your organism is not available, you can create a custom SnpEff Database if a reference fasta and gff file are available.

**4) `params.outdir`** - By default, output files go to `params.outdir/out`, temporary GATK files to `params.outdir/gatk_temp`, SnpEff database files to `params.outdir/snpeff_db`, and Nextflow will run analysis in `params.outdir/nextflow_work_dir`. These can be overridden with `params.out`, `params.tmpdir`, `params.snpeff_data`, and `workDir` respectively. Note: no `params.` prefix for `workDir`.

**5) `params.pl`** - Platform. E.g. Illumina (required for read groups).

**6) `params.pm`** - Machine. E.g. nextseq (required for read groups).

## Examples

**Note: If you are working on the NYU HPC, you should run all nextflow jobs in an interactive slurm session.** This is because Nextflow uses some resources in managing your workflow.

### Scenario 1: Hard code all parameters in config file

Copy `nextflow.config` into a new directory. Edit the first six parameters:

```
params.reads = "/path/to/reads/*_n0{1,2}_*.fastq.gz"
params.ref = "/path/to/ref.fa"
params.outdir = "/scratch/user/gatk4/"
params.snpeff_db = "athalianaTair10"
params.pl = "illumina"
params.pm = "nextseq"
```

After activating your conda environment:

```bash
nextflow run main.nf
```

You can specify a different config file:

```bash
nextflow run main.nf -c your.config
```

Note: Parameters in the config can be overridden by command line arguments.

### Scenario 2: Command line parameters

```bash
nextflow run main.nf \
    --reads "/path/to/reads/*_n0{1,2}_*.fastq.gz" \
    --ref "/path/to/ref.fa" \
    --outdir "/scratch/user/gatk4/" \
    --snpeff_db "athalianaTair10" \
    --pl "illumina" \
    --pm "illumina"
```

### Scenario 3: Call directly from GitHub

```bash
nextflow run gencorefacility/variant-calling-pipeline-gatk4
```

Still need the config file or pass parameters via command line.

### Scenario 4: Use with Docker container

```bash
nextflow run gencorefacility/variant-calling-pipeline-gatk4 -with-docker gencorefacility/variant-calling-pipeline-gatk4
```

### Launching Nextflow

Once running, Nextflow actively manages and monitors jobs. On NYU HPC, the config has `process.executor = 'slurm'` for SLURM submission. Monitor with:

```bash
watch squeue -u <netID>
```

**Note: The session must remain open.** Recommend using tmux, nohup, or submitting as a SLURM job.

Enter `tmux`, launch an interactive slurm session, activate conda, then launch Nextflow. Detach from tmux with `ctrl+B` then `D`. Reattach with `tmux a`.

If interrupted, resume with:

```bash
nextflow run main.nf -resume
```

## Workflow Overview

![GATK4 Variant Calling Pipeline Workflow](/assets/images/blog/Variant-Calling-Pipeline-GATK4-1.png)

---

### Step 1 - Alignment - Map to Reference

| Field | Value |
|---|---|
| **Tool** | BWA MEM |
| **Input** | .fastq files, reference genome |
| **Output** | aligned_reads.sam |
| **Notes** | `-Y` tells BWA to use soft clipping for supplementary alignments. `-K` tells BWA to process INT input bases in each batch regardless of nThreads (for reproducibility). Readgroup info is provided with the `-R` flag. This information is key for downstream GATK functionality. GATK will not work without a read group tag. |

**Command:**

```bash
bwa mem \
    -K 100000000 \
    -Y \
    -R '@RG\tID:sample_1\tLB:sample_1\tPL:ILLUMINA\tPM:HISEQ\tSM:sample_1' \
    ref.fa \
    sample_1_reads_1.fq \
    sample_1_reads_2.fq \
    > aligned_reads.sam
```

---

### Step 2 - Mark Duplicates + Sort

| Field | Value |
|---|---|
| **Tool** | GATK4 MarkDuplicatesSpark |
| **Input** | aligned_reads.sam |
| **Output** | sorted_dedup_reads.bam, sorted_dedup_reads.bam.bai, dedup_metrics.txt |
| **Notes** | In GATK4, the Mark Duplicates and Sort Sam steps have been combined into one step using MarkDuplicatesSpark. The BAM index file (.bai) is created by default. The tool is optimized to run on queryname-grouped alignments. The output of BWA is query-grouped, however if provided coordinate-sorted alignments, the tool will spend additional time first queryname sorting the reads internally. Due to this internal sorting, the tool produces identical results regardless of input sort-order. You don't need a Spark cluster to run Spark-enabled GATK tools - the engine can use Spark to create a virtual standalone cluster and use available CPU cores. |

**Command:**

```bash
gatk MarkDuplicatesSpark \
    -I aligned_reads.sam \
    -M dedup_metrics.txt \
    -O sorted_dedup_reads.bam
```

---

### Step 3 - Collect Alignment & Insert Size Metrics

| Field | Value |
|---|---|
| **Tool** | Picard Tools, R, Samtools |
| **Input** | sorted_dedup_reads.bam, reference genome |
| **Output** | alignment_metrics.txt, insert_metrics.txt, insert_size_histogram.pdf, depth_out.txt |

**Commands:**

```bash
java -jar picard.jar \
    CollectAlignmentSummaryMetrics \
    R=ref.fa \
    I=sorted_dedup_reads.bam \
    O=alignment_metrics.txt
```

```bash
java -jar picard.jar \
    CollectInsertSizeMetrics \
    INPUT=sorted_dedup_reads.bam \
    OUTPUT=insert_metrics.txt \
    HISTOGRAM_FILE=insert_size_histogram.pdf
```

```bash
samtools depth -a sorted_dedup_reads.bam > depth_out.txt
```

---

### Step 4 - Call Variants

| Field | Value |
|---|---|
| **Tool** | GATK4 HaplotypeCaller |
| **Input** | sorted_dedup_reads.bam, reference genome |
| **Output** | raw_variants.vcf |
| **Notes** | First round of variant calling. The variants identified in this step will be filtered and provided as input for Base Quality Score Recalibration (BQSR). |

**Command:**

```bash
gatk HaplotypeCaller \
    -R ref.fa \
    -I sorted_dedup_reads.bam \
    -O raw_variants.vcf
```

---

### Step 5 - Extract SNPs & Indels

| Field | Value |
|---|---|
| **Tool** | GATK4 SelectVariants |
| **Input** | raw_variants.vcf, reference genome |
| **Output** | raw_indels.vcf, raw_snps.vcf |
| **Notes** | This step separates SNPs and Indels so they can be processed and used independently. |

**Commands:**

```bash
gatk SelectVariants \
    -R ref.fa \
    -V raw_variants.vcf \
    -select-type SNP \
    -O raw_snps.vcf
```

```bash
gatk SelectVariants \
    -R ref.fa \
    -V raw_variants.vcf \
    -select-type INDEL \
    -O raw_indels.vcf
```

---

### Step 6 - Filter SNPs

| Field | Value |
|---|---|
| **Tool** | GATK4 VariantFiltration |
| **Input** | raw_snps.vcf, reference genome |
| **Output** | filtered_snps.vcf, filtered_snps.vcf.idx |
| **Notes** | See filter descriptions below. |

**Filter descriptions:**

- **QD < 2.0** - Variant confidence divided by unfiltered depth of non-hom-ref samples. Normalizes variant quality to avoid inflation from deep coverage.
- **FS > 60.0** - Phred-scaled probability of strand bias. Close to 0 when no strand bias.
- **MQ < 40.0** - Root mean square mapping quality. Around 60 when mapping qualities are good.
- **SOR > 4.0** - Strand bias test similar to symmetric odds ratio test. Created because FS tends to penalize variants at exon ends.
- **MQRankSum < -12.5** - Compares mapping qualities of reads supporting reference vs alternate alleles.
- **ReadPosRankSum < -8.0** - Compares positions of reference and alternate alleles within reads. Alleles only near read ends indicates error.

Learn more: [Hard-filtering germline short variants](https://gatk.broadinstitute.org/hc/en-us/articles/360035890471-Hard-filtering-germline-short-variants)

Note: SNPs 'filtered out' remain in the file marked as '_filter', passing ones marked as 'PASS'. We extract passing SNPs for BQSR in the next step.

**Command:**

```bash
gatk VariantFiltration \
    -R ref.fa \
    -V raw_snps.vcf \
    -O filtered_snps.vcf \
    -filter-name "QD_filter" -filter "QD < 2.0" \
    -filter-name "FS_filter" -filter "FS > 60.0" \
    -filter-name "MQ_filter" -filter "MQ < 40.0" \
    -filter-name "SOR_filter" -filter "SOR > 4.0" \
    -filter-name "MQRankSum_filter" -filter "MQRankSum < -12.5" \
    -filter-name "ReadPosRankSum_filter" -filter "ReadPosRankSum < -8.0"
```

---

### Step 7 - Filter Indels

| Field | Value |
|---|---|
| **Tool** | GATK4 VariantFiltration |
| **Input** | raw_indels.vcf, reference genome |
| **Output** | filtered_indels.vcf, filtered_indels.vcf.idx |
| **Notes** | See filter descriptions below. |

**Filter descriptions:**

- **QD < 2.0** - Variant confidence divided by unfiltered depth of non-hom-ref samples.
- **FS > 200.0** - Phred-scaled probability of strand bias (higher threshold for indels).
- **SOR > 10.0** - Strand bias test (higher threshold for indels).

Note: Indels 'filtered out' remain in the file marked as '_filter', passing ones marked as 'PASS'. We extract passing indels for BQSR next.

**Command:**

```bash
gatk VariantFiltration \
    -R ref.fa \
    -V raw_indels.vcf \
    -O filtered_indels.vcf \
    -filter-name "QD_filter" -filter "QD < 2.0" \
    -filter-name "FS_filter" -filter "FS > 200.0" \
    -filter-name "SOR_filter" -filter "SOR > 10.0"
```

---

### Step 8 - Exclude Filtered Variants

| Field | Value |
|---|---|
| **Tool** | GATK4 SelectVariants |
| **Input** | filtered_snps.vcf, filtered_indels.vcf |
| **Output** | bqsr_snps.vcf, bqsr_indels.vcf |
| **Notes** | Extract only the passing variants as input to BQSR. |

**Commands:**

```bash
gatk SelectVariants \
    --exclude-filtered \
    -V filtered_snps.vcf \
    -O bqsr_snps.vcf
```

```bash
gatk SelectVariants \
    --exclude-filtered \
    -V filtered_indels.vcf \
    -O bqsr_indels.vcf
```

---

### Step 9 - Base Quality Score Recalibration (BQSR) #1

| Field | Value |
|---|---|
| **Tool** | GATK4 BaseRecalibrator |
| **Input** | sorted_dedup_reads.bam (from step 2), bqsr_snps.vcf, bqsr_indels.vcf, reference genome |
| **Output** | recal_data.table |
| **Notes** | BQSR is performed twice. The second pass is optional, only required to produce a recalibration report. |

**Command:**

```bash
gatk BaseRecalibrator \
    -R ref.fa \
    -I sorted_dedup_reads.bam \
    --known-sites bqsr_snps.vcf \
    --known-sites bqsr_indels.vcf \
    -O recal_data.table
```

---

### Step 10 - Apply BQSR

| Field | Value |
|---|---|
| **Tool** | GATK4 ApplyBQSR |
| **Input** | recal_data.table, sorted_dedup_reads.bam, reference genome |
| **Output** | recal_reads.bam |
| **Notes** | This step applies the recalibration computed in the first BQSR step to the bam file. This recalibrated bam file is now analysis-ready. |

**Command:**

```bash
gatk ApplyBQSR \
    -R ref.fa \
    -I sorted_dedup_reads.bam \
    -bqsr recal_data.table \
    -O recal_reads.bam
```

---

### Step 11 - Base Quality Score Recalibration (BQSR) #2

| Field | Value |
|---|---|
| **Tool** | GATK4 BaseRecalibrator |
| **Input** | recal_reads.bam, bqsr_snps.vcf, bqsr_indels.vcf, reference genome |
| **Output** | post_recal_data.table |
| **Notes** | This round of BQSR is optional. Required if you want to produce a recalibration report with Analyze Covariates. Uses recalibrated reads from Apply BQSR as input. |

**Command:**

```bash
gatk BaseRecalibrator \
    -R ref.fa \
    -I recal_reads.bam \
    --known-sites bqsr_snps.vcf \
    --known-sites bqsr_indels.vcf \
    -O post_recal_data.table
```

---

### Step 12 - Analyze Covariates

| Field | Value |
|---|---|
| **Tool** | GATK4 AnalyzeCovariates |
| **Input** | recal_data.table, post_recal_data.table |
| **Output** | recalibration_plots.pdf |
| **Notes** | Produces a recalibration report based on the output from the two BQSR runs. |

**Command:**

```bash
gatk AnalyzeCovariates \
    -before recal_data.table \
    -after post_recal_data.table \
    -plots recalibration_plots.pdf
```

---

### Step 13 - Call Variants (Second Round)

| Field | Value |
|---|---|
| **Tool** | GATK4 HaplotypeCaller |
| **Input** | recal_reads.bam, reference genome |
| **Output** | raw_variants_recal.vcf |
| **Notes** | Second round of variant calling performed using recalibrated (analysis-ready) bam. |

**Command:**

```bash
gatk HaplotypeCaller \
    -R ref.fa \
    -I recal_reads.bam \
    -O raw_variants_recal.vcf
```

---

### Step 14 - Extract SNPs & Indels (Second Round)

| Field | Value |
|---|---|
| **Tool** | GATK4 SelectVariants |
| **Input** | raw_variants_recal.vcf, reference genome |
| **Output** | raw_indels_recal.vcf, raw_snps_recal.vcf |
| **Notes** | Separates SNPs and Indels for independent processing and analysis. |

**Commands:**

```bash
gatk SelectVariants \
    -R ref.fa \
    -V raw_variants_recal.vcf \
    -select-type SNP \
    -O raw_snps_recal.vcf
```

```bash
gatk SelectVariants \
    -R ref.fa \
    -V raw_variants_recal.vcf \
    -select-type INDEL \
    -O raw_indels_recal.vcf
```

---

### Step 15 - Filter SNPs (Final)

| Field | Value |
|---|---|
| **Tool** | GATK4 VariantFiltration |
| **Input** | raw_snps_recal.vcf, reference genome |
| **Output** | filtered_snps_final.vcf, filtered_snps_final.vcf.idx |
| **Notes** | Same filters as Step 6. SNPs 'filtered out' remain in the file marked as '_filter', passing ones marked as 'PASS'. |

**Command:**

```bash
gatk VariantFiltration \
    -R ref.fa \
    -V raw_snps_recal.vcf \
    -O filtered_snps_final.vcf \
    -filter-name "QD_filter" -filter "QD < 2.0" \
    -filter-name "FS_filter" -filter "FS > 60.0" \
    -filter-name "MQ_filter" -filter "MQ < 40.0" \
    -filter-name "SOR_filter" -filter "SOR > 4.0" \
    -filter-name "MQRankSum_filter" -filter "MQRankSum < -12.5" \
    -filter-name "ReadPosRankSum_filter" -filter "ReadPosRankSum < -8.0"
```

---

### Step 16 - Filter Indels (Final)

| Field | Value |
|---|---|
| **Tool** | GATK4 VariantFiltration |
| **Input** | raw_indels_recal.vcf, reference genome |
| **Output** | filtered_indels_final.vcf, filtered_indels_final.vcf.idx |
| **Notes** | Same filters as Step 7. Indels 'filtered out' remain marked as '_filter', passing ones marked as 'PASS'. |

**Command:**

```bash
gatk VariantFiltration \
    -R ref.fa \
    -V raw_indels_recal.vcf \
    -O filtered_indels_final.vcf \
    -filter-name "QD_filter" -filter "QD < 2.0" \
    -filter-name "FS_filter" -filter "FS > 200.0" \
    -filter-name "SOR_filter" -filter "SOR > 10.0"
```

---

### Step 17 - Annotate SNPs and Predict Effects

| Field | Value |
|---|---|
| **Tool** | SnpEff |
| **Input** | filtered_snps_final.vcf |
| **Output** | filtered_snps_final.ann.vcf, snpeff_summary.html, snpEff_genes.txt |

**Command:**

```bash
java -jar snpEff.jar -v \
    <snpeff_db> \
    filtered_snps_final.vcf > filtered_snps_final.ann.vcf
```

---

### Step 18 - Compile Statistics

| Field | Value |
|---|---|
| **Tool** | parse_metrics.sh (in `/bin`) |
| **Input** | sample_id_alignment_metrics.txt, sample_id_insert_metrics.txt, sample_id_dedup_metrics.txt, sample_id_raw_snps.vcf, sample_id_filtered_snps.vcf, sample_id_raw_snps_recal.vcf, sample_id_filtered_snps_final.vcf, sample_id_depth_out.txt |
| **Output** | report.csv |
| **Notes** | A single report file is generated with summary statistics for each library: # of Reads, # of Aligned Reads, % Aligned, # Aligned Bases, Read Length, % Paired, % Duplicate, Mean Insert Size, # SNPs, # Filtered SNPs, # SNPs after BQSR, # Filtered SNPs after BQSR, Average Coverage. |

**Command:**

```bash
parse_metrics.sh sample_id > sample_id_report.csv
```

Give the script a sample id and it will look for the corresponding `sample_id_*` files and print the statistics and header to stdout.
