# Generated manually - add course and file fields to Resource

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0001_initial'),
        ('resources', '0003_pgvector_indexes'),
    ]

    operations = [
        migrations.AddField(
            model_name='resource',
            name='course',
            field=models.ForeignKey(
                blank=True,
                help_text='Course this resource belongs to',
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='resources',
                to='courses.course'
            ),
        ),
        migrations.AddField(
            model_name='resource',
            name='file',
            field=models.FileField(
                blank=True,
                help_text='Uploaded file (PDF, DOCX, etc.)',
                null=True,
                upload_to='resources/files/'
            ),
        ),
        migrations.AlterField(
            model_name='resource',
            name='resource_type',
            field=models.CharField(
                blank=True,
                choices=[
                    ('pdf', 'PDF Document'),
                    ('docx', 'Word Document'),
                    ('txt', 'Text File'),
                    ('pptx', 'PowerPoint'),
                    ('article', 'Article'),
                    ('video', 'Video'),
                    ('book', 'Book'),
                    ('course', 'Online Course'),
                    ('tutorial', 'Tutorial'),
                    ('documentation', 'Documentation'),
                    ('paper', 'Research Paper'),
                    ('quiz', 'Quiz/Practice'),
                    ('tool', 'Tool/Software'),
                    ('url', 'Web Link'),
                    ('other', 'Other'),
                ],
                help_text='Type of resource',
                max_length=20
            ),
        ),
    ]
