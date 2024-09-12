<?php

namespace Drupal\islandora_iiif_hocr_extend\Plugin\search_api\processor;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Session\AnonymousUserSession;
use Drupal\file\FileInterface;
use Drupal\islandora_hocr\Plugin\search_api\processor\Property\HOCRFieldProperty;
use Drupal\media\Plugin\media\Source\File;
use Drupal\node\NodeInterface;
use Drupal\search_api\Datasource\DatasourceInterface;
use Drupal\search_api\Item\ItemInterface;
use Drupal\search_api\Plugin\PluginFormTrait;
use Drupal\search_api\Processor\ProcessorPluginBase;
use Drupal\search_api\SearchApiException;
use Drupal\islandora_hocr\Plugin\search_api\processor\HOCRField;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Facilitate indexing of HOCR.
 *
 * @SearchApiProcessor(
 *   id = "islandora_hocr_extracted_field",
 *   label = @Translation("Islandora hOCR Extracted field"),
 *   description = @Translation("Extract and Add hOCR to the index."),
 *   stages = {
 *     "add_properties" = 20,
 *   },
 *   locked = true,
 *   hidden = true,
 * )
 */
class HOCRFieldExtracted extends HOCRField {

  use PluginFormTrait;

  const PROPERTY_NAME = 'islandora_hocr_extracted_field';

  /**
   * The entity type manager service.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected EntityTypeManagerInterface $entityTypeManager;

  /**
   * {@inheritDoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    $instance = parent::create($container, $configuration, $plugin_id, $plugin_definition);

    $instance->entityTypeManager = $container->get('entity_type.manager');

    return $instance;
  }

  /**
   * {@inheritDoc}
   *
   */
  public function addFieldValues(ItemInterface $item) {
    try {
      $entity = $item->getOriginalObject()->getValue();
    }
    catch (SearchApiException $e) {
      return;
    }

    if (!($entity instanceof NodeInterface)) {
      return;
    }

    $data = [
      'file' => [
        'value' => NULL,
      ],
      'uri' => [
        'value' => NULL,
      ],
      'content' => [
        'value' => NULL,
      ],
    ];
    $data['file']['callable'] = function () use ($entity, &$data) {
      $data['file']['value'] ??= $this->getFile($entity);
      return $data['file']['value'];
    };
    $data['uri']['callable'] = function () use (&$data) {
      $data['uri']['value'] ??= $data['file']['callable']() ? $data['file']['value']->getFileUri() : NULL;
      return $data['uri']['value'];
    };
    $data['content']['callable'] = function () use (&$data) {
      $data['content']['value'] ??= $data['uri']['callable']() ? file_get_contents($data['uri']['value']) : NULL;
      return $data['content']['value'];
    };

    $fields = $item->getFields();

    foreach ($data as $key => $info) {
      $spec_fields = $this->getFieldsHelper()
        ->filterForPropertyPath(
          $fields,
          $item->getDatasourceId(),
          static::PROPERTY_NAME . ":$key"
        );
      foreach ($spec_fields as $field) {
        if (!$field->getValues()) {
          // Lazily load content from entity, as the field might already be
          // populated.
          // strip all tags of xml
          $cleaned = \strip_tags($info['callable']());

          // remove white space and new line after strip_tags
          $cleaned = preg_replace('/\s+/', ' ', $cleaned);

          // remove if any "- ", if there is
          $cleaned = str_replace('- ', '', $cleaned);
          $field->addValue($cleaned);
        }
      }
    }
  }
}
